<?php

namespace Modules\Billing\Actions;

use Brick\Math\BigDecimal;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Services\InvoiceCalculator;
use Modules\Billing\Settings\BillingSettings;
use Modules\Billing\Support\PaymentMethods;

class ManagePayments
{
    // SQLite row locks are ineffective. Reserve its writer before any transaction reads.
    private function lockInvoice(int $id): Invoice
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::table('billing_invoices')->where('id', $id)->update(['version' => DB::raw('version')]);
        }

        return Invoice::whereKey($id)->lockForUpdate()->firstOrFail();
    }

    public function record(Invoice $invoice, array $input, ?User $actor, bool $verifiedOnline = false): Payment
    {
        return DB::transaction(function () use ($invoice, $input, $actor, $verifiedOnline) {
            $locked    = $this->lockInvoice($invoice->id);
            $precision = $locked->currency_precision;
            try {
                $minor = BigDecimal::of($input['amount'])->multipliedBy(10 ** $precision)->toBigInteger();
            } catch (\Brick\Math\Exception\MathException) {
                throw ValidationException::withMessages(['amount' => 'Enter an amount with at most '.$precision.' decimal places.']);
            }
            if (! $minor->isPositive() || $minor->isGreaterThan(InvoiceCalculator::MAX_MINOR)) {
                throw ValidationException::withMessages(['amount' => 'Enter a positive amount within the supported range.']);
            }
            $hash     = hash('sha256', json_encode([$locked->id, (string) $minor, $input['currency'], $input['payment_date'], $input['method'], $input['reference'] ?? null, $input['notes'] ?? null], JSON_THROW_ON_ERROR));
            $existing = Payment::where('request_key', $input['request_key'])->first();
            if ($existing) {
                if ($verifiedOnline && $existing->provider_payment_id !== $input['provider_payment_id']) {
                    throw ValidationException::withMessages(['request_key' => 'This checkout already recorded another payment. Review the additional charge.']);
                }
                if (! hash_equals($existing->request_hash, $hash)) {
                    throw ValidationException::withMessages(['request_key' => 'This submission key was already used for different payment details. Reopen the payment form.']);
                }

                return $existing;
            }
            abort_unless($locked->status === 'issued', 409, 'Only issued invoices can receive payments.');
            if ($locked->version !== (int) $input['version']) {
                throw ValidationException::withMessages(['version' => 'The invoice changed. Reload it before recording a payment.']);
            }
            if ($input['currency'] !== $locked->currency) {
                throw ValidationException::withMessages(['currency' => 'Payment currency must match the invoice currency.']);
            }
            if (! $verifiedOnline && ! in_array($input['method'], array_column(PaymentMethods::options(), 'value'), true)) {
                throw ValidationException::withMessages(['method' => 'This payment method is disabled. Choose an enabled method.']);
            }
            $today = CarbonImmutable::now(app(BillingSettings::class)->timezone)->format('Y-m-d');
            if ($input['payment_date'] < $locked->invoice_date->format('Y-m-d') || $input['payment_date'] > $today) {
                throw ValidationException::withMessages(['payment_date' => 'Payment date must be between the invoice date and today in the business timezone.']);
            }
            $balance = \Brick\Math\BigInteger::of($locked->total_minor)->minus(app(InvoiceBalance::class)->paidMinor($locked))->minus(app(InvoiceBalance::class)->creditedMinor($locked));
            if ($minor->isGreaterThan($balance)) {
                throw ValidationException::withMessages(['amount' => 'Payment exceeds the remaining invoice balance of '.InvoiceCalculator::money((string) $balance, $precision).' '.$locked->currency.'.']);
            }
            $method = $verifiedOnline
                ? PaymentMethods::resolve($input['provider'] ?? 'dodo', app(\Modules\Billing\Services\PaymentGatewayRegistry::class)->get($input['provider'] ?? 'dodo')->name(), true)
                : \Modules\Billing\Models\PaymentMethod::where('code', $input['method'])->where('manual', true)->lockForUpdate()->first();
            if (! $method || (! $verifiedOnline && ! $method->enabled)) {
                throw ValidationException::withMessages(['method' => 'This payment method was removed or disabled. Reload and choose another method.']);
            }
            $payment = Payment::create([
                'payment_method_id' => $method->id,
                'invoice_id'        => $locked->id, 'request_key' => $input['request_key'], 'request_hash' => $hash,
                'amount_minor'      => (string) $minor, 'currency' => $locked->currency, 'currency_precision' => $precision,
                'payment_date'      => $input['payment_date'], 'method' => $input['method'], 'method_label' => $method->name,
                'provider'          => $verifiedOnline ? ($input['provider'] ?? 'dodo') : null, 'provider_payment_id' => $verifiedOnline ? $input['provider_payment_id'] : null,
                'reference'         => $input['reference'] ?? null, 'notes' => $input['notes'] ?? null,
                'actor_id'          => $actor?->id, 'actor_name' => $actor?->name ?? 'Payment provider', 'created_at' => now(),
            ]);
            $locked->version++;
            $locked->save();
            $locked->recordActivity('payment_recorded', 'Payment #'.$payment->id.' recorded: '.InvoiceCalculator::money((string) $minor, $precision).' '.$locked->currency.' via '.$payment->method_label.'.', $actor);

            $automation = app(\Modules\Billing\Settings\BillingAutomationSettings::class);
            if ($automation->receipt_email || $automation->receipt_sms) {
                \Modules\Billing\Jobs\QueuePaymentReceipt::dispatch($payment->id)->onQueue('billing')->afterCommit();
            }

            return $payment;
        }, 5);
    }

    public function reverse(Payment $payment, array $input, User $actor): Payment
    {
        return DB::transaction(function () use ($payment, $input, $actor) {
            if ($payment->provider !== null) {
                throw ValidationException::withMessages(['reason' => 'Use the credit and refund workflow for a provider payment. A ledger reversal does not refund the provider charge.']);
            }
            $invoice = $this->lockInvoice($payment->invoice_id);
            $locked  = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            if ($locked->reversed_at) {
                return $locked;
            }
            abort_unless($invoice->status === 'issued', 409, 'Only payments on issued invoices can be reversed.');
            if ($invoice->version !== (int) $input['version']) {
                throw ValidationException::withMessages(['version' => 'The invoice changed. Reload it before reversing a payment.']);
            }
            $locked->forceFill(['reversed_at' => now(), 'reversal_date' => now(app(BillingSettings::class)->timezone)->format('Y-m-d'), 'reversed_by' => $actor->id, 'reversed_by_name' => $actor->name, 'reversal_reason' => $input['reason']])->save();
            $invoice->version++;
            $invoice->save();
            $invoice->recordActivity('payment_reversed', 'Payment #'.$locked->id.' reversed: '.$input['reason'], $actor);

            return $locked;
        }, 5);
    }
}
