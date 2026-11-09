<?php

namespace Modules\Billing\Actions;

use Brick\Math\BigDecimal;
use Brick\Math\BigInteger;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Billing\Services\BillingSnapshots;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Services\InvoiceCalculator;
use Modules\Billing\Services\InvoicePresentation;

class ReviseInvoice
{
    public function handle(array $data, Invoice $invoice): Invoice
    {
        return DB::transaction(function () use ($data, $invoice) {
            if (DB::connection()->getDriverName() === 'sqlite') {
                DB::table('billing_invoices')->where('id', $invoice->id)->update(['version' => DB::raw('version')]);
            }
            $locked = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->status === 'issued', 409, 'Only issued invoices can be revised.');
            $pendingDeliveries = \Modules\Billing\Models\InvoiceDelivery::where('invoice_id', $locked->id)->whereIn('state', ['queued', 'sending'])->lockForUpdate()->get();
            if ($pendingDeliveries->contains('state', 'sending')) {
                throw ValidationException::withMessages(['invoice' => 'A delivery is in progress. Wait for it to finish before editing this invoice.']);
            }
            $customer = app(ValidateDraftReferences::class)->check($data, $locked, true, true);
            $before   = app(InvoicePresentation::class)->data($locked);
            $totals   = app(InvoiceCalculator::class)->calculate($data);
            $balance  = app(InvoiceBalance::class);
            if ($locked->creditAllocations()->whereNull('reversed_at')->exists() || \Modules\Billing\Models\CreditNote::where('invoice_id', $locked->id)->where('status', 'issued')->exists()) {
                throw ValidationException::withMessages(['invoice' => 'Reverse the existing credit notes and allocations before revising this invoice.']);
            }
            $payments = $locked->payments()->lockForUpdate()->get();
            if ($payments->isNotEmpty() && (int) $data['customer_id'] !== $locked->customer_id) {
                throw ValidationException::withMessages(['customer_id' => 'This invoice has recorded payments. Keep its customer and edit the billing address instead.']);
            }
            $paymentChanges = [];
            if ($data['currency'] !== $locked->currency) {
                if (DB::table('billing_online_checkouts')->where('invoice_id', $locked->id)->whereIn('state', ['creating', 'pending'])->exists()) {
                    throw ValidationException::withMessages(['currency' => 'An online payment is pending. Finish or cancel it before correcting the currency.']);
                }
                if ($payments->isNotEmpty()) {
                    if (! ($data['correct_payment_currency'] ?? false)) {
                        throw ValidationException::withMessages(['currency' => 'Confirm the currency correction for this invoice and its recorded payments.']);
                    }
                    abort_unless(auth()->user()?->can('record', [Payment::class, $locked]), 403);
                    foreach ($payments as $payment) {
                        if ($payment->provider !== null) {
                            throw ValidationException::withMessages(['currency' => 'Online payment currencies cannot be corrected here. Use the refund workflow for the original charge.']);
                        }
                        $previous = $payment->only(['id', 'currency', 'currency_precision', 'amount_minor']);
                        try {
                            $minor = BigDecimal::of(InvoiceCalculator::money((string) $payment->amount_minor, $payment->currency_precision))
                                ->multipliedBy(10 ** $totals['precision'])->toBigInteger();
                        } catch (\Brick\Math\Exception\MathException) {
                            throw ValidationException::withMessages(['currency' => 'A recorded payment has decimal places that '.$data['currency'].' does not support. Its amount has not been rounded or changed.']);
                        }
                        if ($minor->isGreaterThan(InvoiceCalculator::MAX_MINOR)) {
                            throw ValidationException::withMessages(['currency' => 'A recorded payment exceeds the supported amount in this currency.']);
                        }
                        $payment->forceFill(['currency' => $data['currency'], 'currency_precision' => $totals['precision'], 'amount_minor' => (string) $minor])->save();
                        $paymentChanges[] = ['before' => $previous, 'after' => $payment->only(['id', 'currency', 'currency_precision', 'amount_minor'])];
                    }
                }
            }
            $locked->setRelation('payments', $payments);
            $paid     = $balance->paidMinor($locked);
            $credited = $balance->creditedMinor($locked);
            if (BigInteger::of($totals['total_minor'])->isLessThan($paid->plus($credited))) {
                throw ValidationException::withMessages(['items' => 'The revised total cannot be below the amount already paid or credited. Adjust the payment or credit first.']);
            }
            $firstPayment = $locked->payments()->whereNull('reversed_at')->min('payment_date');
            if ($firstPayment && $data['invoice_date'] > substr($firstPayment, 0, 10)) {
                throw ValidationException::withMessages(['invoice_date' => 'The invoice date cannot be after a recorded payment date.']);
            }
            $locked->fill(Arr::only($data, ['customer_id', 'invoice_date', 'due_date', 'currency', 'discount_mode', 'discount_value', 'customer_note', 'internal_note', 'terms', 'payment_instructions']));
            if ($before['customer_id'] !== (int) $data['customer_id'] || ($data['refresh_customer'] ?? false)) {
                $locked->customer_snapshot = BillingSnapshots::customer($customer);
            }
            if (isset($data['billing_details']['customer']) && ! ($data['refresh_customer'] ?? false)) {
                $locked->customer_snapshot = [...$locked->customer_snapshot, ...$data['billing_details']['customer']];
            }
            if (isset($data['billing_details']['seller'])) {
                $locked->seller_snapshot = [...$locked->seller_snapshot, ...$data['billing_details']['seller']];
            }
            $locked->customer_name      = $locked->customer_snapshot['display_name'];
            $locked->currency_precision = $totals['precision'];
            foreach (['subtotal_minor', 'discount_minor', 'tax_minor', 'total_minor'] as $field) {
                $locked->$field = $totals[$field];
            }
            $locked->version++;
            $locked->save();
            $locked->items()->get()->each(fn ($item) => $item->delete());
            foreach ($data['items'] as $position => $input) {
                $line = $totals['lines'][$position];
                $item = $locked->items()->create([...Arr::only($input, ['key', 'service_id', 'description', 'additional_description', 'unit', 'quantity', 'rate']), 'unit' => $input['unit'] ?? '', ...Arr::only($line, ['gross_minor', 'discount_minor', 'net_minor', 'tax_minor', 'total_minor']), 'position' => $position]);
                foreach ($line['taxes'] as $tax) {
                    $item->taxes()->create(Arr::only($tax, ['tax_rate_id', 'name', 'percentage', 'amount_minor']));
                }
            }
            $locked->unsetRelation('items');
            $after = app(InvoicePresentation::class)->data($locked);
            $locked->activities()->create(['event' => 'invoice_updated', 'description' => 'Invoice updated (version '.$locked->version.'). Total: '.$before['totals']['total'].' '.$before['currency'].' → '.$after['totals']['total'].' '.$locked->currency.'.', 'actor_id' => auth()->id(), 'actor_name' => auth()->user()?->name ?? 'System', 'created_at' => now(), 'changes' => ['before' => $before, 'after' => $after, 'payments' => $paymentChanges]]);
            if ($paymentChanges !== []) {
                $locked->recordActivity('payment_currency_corrected', 'Currency corrected from '.$before['currency'].' to '.$locked->currency.' for the invoice and '.count($paymentChanges).' recorded payment(s). Numeric amounts were preserved; no exchange conversion was applied.', auth()->user());
            }
            foreach ($pendingDeliveries as $delivery) {
                $delivery->update(['state' => 'skipped', 'error' => 'The invoice changed before sending. Send the updated invoice explicitly.']);
            }
            if ($pendingDeliveries->isNotEmpty() && \Modules\Billing\Events\InvoiceDeliveryUpdated::enabled()) {
                DB::afterCommit(fn () => rescue(fn () => \Modules\Billing\Events\InvoiceDeliveryUpdated::dispatch($locked->id), report: true));
            }

            return $locked;
        }, 5);
    }
}
