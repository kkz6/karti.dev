<?php

namespace Modules\Billing\Actions;

use Brick\Math\BigDecimal;
use Brick\Math\BigInteger;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Models\User;
use Modules\Billing\Models\CreditAllocation;
use Modules\Billing\Models\CreditNote;
use Modules\Billing\Models\CreditRefund;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Services\CreditBalance;
use Modules\Billing\Services\CreditTaxAllocation;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Services\InvoiceCalculator;
use Modules\Billing\Settings\BillingSettings;

class ManageCreditNotes
{
    private function lock(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            DB::table('billing_invoice_sequences')->where('scope', 'credits')->update(['next_number'=>DB::raw('next_number')]);
        }DB::table('billing_invoice_sequences')->where('scope', 'credits')->lockForUpdate()->firstOrFail();
    }

    public function minor(string $amount, int $precision): int
    {
        try {
            $n=BigDecimal::of($amount)->multipliedBy(10 ** $precision)->toBigInteger();
        } catch (\Throwable) {
            throw ValidationException::withMessages(['amount'=>'Use the currency precision for the amount.']);
        }if (! $n->isPositive() || $n->isGreaterThan(InvoiceCalculator::MAX_MINOR)) {
            throw ValidationException::withMessages(['amount'=>'Enter a positive supported amount.']);
        }

        return $n->toInt();
    }

    private function date(string $date, string $minimum): void
    {
        if ($date < $minimum || $date > now(app(BillingSettings::class)->timezone)->format('Y-m-d')) {
            throw ValidationException::withMessages(['credit_date'=>'Date must be between the original invoice date and today.']);
        }
    }

    public function create(Invoice $invoice, array $data, User $actor): CreditNote
    {
        $minor=$this->minor($data['amount'], $invoice->currency_precision);
        $hash =hash('sha256', json_encode([$invoice->id, $minor, $data['credit_date'], $data['reason']], JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($invoice, $data, $actor, $minor, $hash) {
            $this->lock();
            $source=Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            $old   =CreditNote::where('request_key', $data['request_key'])->first();
            if ($old) {
                if (! hash_equals($old->request_hash, $hash)) {
                    throw ValidationException::withMessages(['amount'=>'This request key already belongs to different credit details.']);
                }

                return $old;
            }
            abort_unless($source->status === 'issued', 409, 'Create a credit against an issued invoice.');
            $this->date($data['credit_date'], $source->invoice_date->format('Y-m-d'));
            $allocation=app(CreditTaxAllocation::class)->calculate($source, $minor);

            return CreditNote::create(['status' => 'draft', 'version' => 1, 'invoice_id'=>$source->id, 'customer_id'=>$source->customer_id, 'currency'=>$source->currency, 'currency_precision'=>$source->currency_precision, 'total_minor'=>$minor, ...$allocation, 'seller_snapshot'=>$source->seller_snapshot, 'customer_snapshot'=>$source->customer_snapshot, 'credit_date'=>$data['credit_date'], 'reason'=>$data['reason'], 'request_key'=>$data['request_key'], 'request_hash'=>$hash, 'actor_id'=>$actor->id]);
        }, 5);
    }

    public function review(CreditNote $note): array
    {
        $source    =Invoice::findOrFail($note->invoice_id);
        $allocation=app(CreditTaxAllocation::class)->calculate($source, $note->total_minor);
        $token     =hash_hmac('sha256', json_encode([$note->id, $note->version, $note->total_minor, $note->reason, $note->credit_date->format('Y-m-d'), $source->version, $allocation], JSON_THROW_ON_ERROR), config('app.key'));

        return ['token'=>$token, 'allocation'=>$allocation];
    }

    public function issue(CreditNote $note, array $data, User $actor): CreditNote
    {
        return DB::transaction(function () use ($note, $data, $actor) {
            $this->lock();
            $source=Invoice::whereKey($note->invoice_id)->lockForUpdate()->firstOrFail();
            $locked=CreditNote::whereKey($note->id)->lockForUpdate()->firstOrFail();
            if ($locked->status === 'issued') {
                return $locked;
            }abort_unless($locked->status === 'draft' && $source->status === 'issued', 409, 'Only draft credits against an issued invoice can be issued.');
            $review=$this->review($locked);
            if ($locked->version !== (int) $data['version'] || ! hash_equals($review['token'], $data['review_token'])) {
                throw ValidationException::withMessages(['review'=>'Credit budget changed. Reload the credit review.']);
            }
            $this->date($locked->credit_date->format('Y-m-d'), $source->invoice_date->format('Y-m-d'));
            $seq=DB::table('billing_invoice_sequences')->where('scope', 'credits')->first();
            abort_if($seq->next_number >= PHP_INT_MAX, 409, 'Credit sequence is exhausted.');
            $locked->forceFill([...$review['allocation'], 'status'=>'issued', 'sequence_number'=>$seq->next_number, 'formatted_number'=>'CN-'.str_pad((string) $seq->next_number, 6, '0', STR_PAD_LEFT), 'issued_at'=>now(), 'version'=>$locked->version + 1])->save();
            DB::table('billing_invoice_sequences')->where('scope', 'credits')->update(['next_number'=>$seq->next_number + 1]);
            $source->version++;
            $source->save();
            $source->recordActivity('credit_issued', 'Credit '.$locked->formatted_number.' issued for '.InvoiceCalculator::money((string) $locked->total_minor, $locked->currency_precision).' '.$locked->currency.'.', $actor);

            return $locked;
        }, 5);
    }

    public function allocate(CreditNote $note, Invoice $invoice, array $data, User $actor): CreditAllocation
    {
        return DB::transaction(function () use ($note, $invoice, $data, $actor) {
            $this->lock();
            $note   =CreditNote::whereKey($note->id)->lockForUpdate()->firstOrFail();
            $invoice=Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            $minor  =$this->minor($data['amount'], $note->currency_precision);
            $old    =CreditAllocation::where('request_key', $data['request_key'])->first();
            if ($old) {
                if ($old->credit_note_id !== $note->id || $old->invoice_id !== $invoice->id || $old->amount_minor !== $minor) {
                    throw ValidationException::withMessages(['amount'=>'Allocation key already used with different details.']);
                }

                return $old;
            }
            if ($note->status !== 'issued' || $invoice->status !== 'issued' || $invoice->currency !== $note->currency || $invoice->customer_id !== $note->customer_id) {
                throw ValidationException::withMessages(['invoice_id'=>'Use an issued invoice for the same customer and currency.']);
            }
            $balance  =app(InvoiceBalance::class);
            $remaining=BigInteger::of($invoice->total_minor)->minus($balance->paidMinor($invoice))->minus($balance->creditedMinor($invoice));
            if (BigInteger::of($minor)->isGreaterThan(app(CreditBalance::class)->available($note)) || BigInteger::of($minor)->isGreaterThan($remaining)) {
                throw ValidationException::withMessages(['amount'=>'Allocation exceeds the available credit or invoice balance.']);
            }
            $allocation=CreditAllocation::create(['credit_note_id'=>$note->id, 'invoice_id'=>$invoice->id, 'amount_minor'=>$minor, 'request_key'=>$data['request_key'], 'actor_id'=>$actor->id, 'actor_name'=>$actor->name]);
            $note->version++;
            $note->save();
            $invoice->version++;
            $invoice->save();
            $invoice->recordActivity('credit_allocated', $note->formatted_number.' applied: '.InvoiceCalculator::money((string) $minor, $note->currency_precision).' '.$note->currency.'.', $actor);

            return $allocation;
        }, 5);
    }

    public function reverseAllocation(CreditAllocation $allocation, string $reason, User $actor): void
    {
        DB::transaction(function () use ($allocation, $reason, $actor) {
            $this->lock();
            $a=CreditAllocation::whereKey($allocation->id)->lockForUpdate()->firstOrFail();
            if ($a->reversed_at) {
                return;
            }$a->update(['reversed_at'=>now(), 'reversal_reason'=>$reason]);
            $note=CreditNote::findOrFail($a->credit_note_id);
            $note->increment('version');
            $invoice=Invoice::findOrFail($a->invoice_id);
            $invoice->increment('version');
            $invoice->recordActivity('credit_allocation_reversed', $note->formatted_number.' allocation reversed: '.$reason, $actor);
        }, 5);
    }

    public function refund(CreditNote $note, array $data, User $actor): CreditRefund
    {
        return DB::transaction(function () use ($note, $data, $actor) {
            $this->lock();
            $note =CreditNote::whereKey($note->id)->lockForUpdate()->firstOrFail();
            $minor=$this->minor($data['amount'], $note->currency_precision);
            $old  =CreditRefund::where('request_key', $data['request_key'])->first();
            if ($old) {
                if ($old->credit_note_id !== $note->id || $old->amount_minor !== $minor || $old->refund_date->format('Y-m-d') !== $data['refund_date'] || $old->reason !== $data['reason'] || (isset($data['method']) ? $old->paymentMethod->code !== $data['method'] : $old->method_label !== $data['method_label']) || $old->reference !== ($data['reference'] ?? null)) {
                    throw ValidationException::withMessages(['amount'=>'Refund key already used with different details.']);
                }

                return $old;
            }
            if ($note->status !== 'issued' || BigInteger::of($minor)->isGreaterThan(app(CreditBalance::class)->available($note))) {
                throw ValidationException::withMessages(['amount'=>'Refund exceeds available credit.']);
            }$this->date($data['refund_date'], $note->credit_date->format('Y-m-d'));
            $method = isset($data['method'])
                ? \Modules\Billing\Models\PaymentMethod::where('manual', true)->where('code', $data['method'])->lockForUpdate()->first()
                : (\Modules\Billing\Models\PaymentMethod::where('name', $data['method_label'])->first() ?? \Modules\Billing\Support\PaymentMethods::resolve('imported', $data['method_label'], true));
            if (! $method || (isset($data['method']) && ! in_array($data['method'], array_column(\Modules\Billing\Support\PaymentMethods::options(), 'value'), true))) {
                throw ValidationException::withMessages(['method' => 'Choose an enabled refund payment method.']);
            }
            $refund=CreditRefund::create(['payment_method_id'=>$method->id, 'credit_note_id'=>$note->id, 'amount_minor'=>$minor, 'currency'=>$note->currency, 'refund_date'=>$data['refund_date'], 'method_label'=>$data['method_label'], 'reference'=>$data['reference'] ?? null, 'reason'=>$data['reason'], 'request_key'=>$data['request_key'], 'actor_id'=>$actor->id, 'actor_name'=>$actor->name]);
            $note->increment('version');
            Invoice::findOrFail($note->invoice_id)->recordActivity('credit_refunded', $note->formatted_number.' refund recorded: '.InvoiceCalculator::money((string) $minor, $note->currency_precision).' '.$note->currency.'.', $actor);

            return $refund;
        }, 5);
    }

    public function reverseRefund(CreditRefund $refund, string $reason, User $actor): void
    {
        DB::transaction(function () use ($refund, $reason, $actor) {
            $this->lock();
            $r=CreditRefund::whereKey($refund->id)->lockForUpdate()->firstOrFail();
            if ($r->reversed_at) {
                return;
            }$r->update(['reversed_at'=>now(), 'reversal_date'=>now(app(BillingSettings::class)->timezone)->format('Y-m-d'), 'reversal_reason'=>$reason]);
            CreditNote::findOrFail($r->credit_note_id)->increment('version');
            Invoice::findOrFail(CreditNote::findOrFail($r->credit_note_id)->invoice_id)->recordActivity('credit_refund_reversed', 'Credit refund #'.$r->id.' reversed: '.$reason, $actor);
        }, 5);
    }

    public function cancel(CreditNote $note, string $reason, User $actor): CreditNote
    {
        return DB::transaction(function () use ($note, $reason, $actor) {
            $this->lock();
            $note=CreditNote::whereKey($note->id)->lockForUpdate()->firstOrFail();
            if ($note->status === 'cancelled') {
                return $note;
            }if (app(CreditBalance::class)->used($note)->isPositive() || app(CreditBalance::class)->refunded($note)->isPositive()) {
                throw ValidationException::withMessages(['reason'=>'Reverse active allocations and refund records before cancelling this credit.']);
            }$note->update(['status'=>'cancelled', 'cancelled_at'=>now(), 'cancellation_reason'=>$reason, 'version'=>$note->version + 1]);
            $source=Invoice::findOrFail($note->invoice_id);
            $source->increment('version');
            $source->recordActivity('credit_cancelled', 'Credit '.($note->formatted_number ?? '#'.$note->id).' cancelled: '.$reason, $actor);

            return $note;
        }, 5);
    }
}
