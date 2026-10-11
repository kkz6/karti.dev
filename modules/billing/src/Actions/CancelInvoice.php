<?php

namespace Modules\Billing\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Invoice;

class CancelInvoice
{
    public function handle(Invoice $invoice, array $input, User $actor): Invoice
    {
        return DB::transaction(function () use ($invoice, $input, $actor) {
            if (DB::connection()->getDriverName() === 'sqlite') {
                DB::table('billing_invoices')->where('id', $invoice->id)->update(['version' => DB::raw('version')]);
            }
            $locked = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            if ($locked->status === 'cancelled') {
                return $locked;
            }
            abort_unless($locked->status === 'issued', 409, 'Only issued invoices can be cancelled.');
            if ($locked->version !== (int) $input['version']) {
                throw ValidationException::withMessages(['reason' => 'The invoice changed. Reload it before cancelling.']);
            }
            if ($locked->payments()->whereNull('reversed_at')->exists()) {
                throw ValidationException::withMessages(['reason' => 'An invoice with active payments cannot be cancelled.']);
            }
            if ($locked->creditAllocations()->whereNull('reversed_at')->exists() || \Modules\Billing\Models\CreditNote::where('invoice_id', $locked->id)->where('status', 'issued')->exists()) {
                throw ValidationException::withMessages(['reason' => 'Cancel issued credit notes and reverse active credit allocations before cancelling this invoice.']);
            }
            $locked->status              = 'cancelled';
            $locked->cancelled_at        = now();
            $locked->cancellation_reason = $input['reason'];
            $locked->version++;
            $locked->save();
            $locked->recordActivity('cancelled', 'Invoice cancelled: '.$input['reason'], $actor);

            return $locked;
        }, 5);
    }
}
