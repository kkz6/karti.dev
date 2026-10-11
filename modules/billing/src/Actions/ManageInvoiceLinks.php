<?php

namespace Modules\Billing\Actions;

use Illuminate\Support\Facades\DB;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\InvoiceLink;

class ManageInvoiceLinks
{
    public function create(Invoice $invoice, int $days=90, string $label='', ?User $actor=null): array
    {
        return DB::transaction(function () use ($invoice, $days, $label, $actor) {
            $locked=Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->status === 'issued', 409, 'Only issued invoices can be shared.');
            $token=bin2hex(random_bytes(32));
            $link =InvoiceLink::create(['invoice_id'=>$locked->id, 'token_hash'=>hash('sha256', $token), 'expires_at'=>now()->addDays($days), 'label'=>$label, 'actor_id'=>$actor?->id]);

            return ['link'=>$link, 'url'=>route('billing.public-invoice', $token)];
        }, 5);
    }

    public function resolve(string $token): InvoiceLink
    {
        return InvoiceLink::where('token_hash', hash('sha256', $token))->whereNull('revoked_at')->where('expires_at', '>', now())->whereHas('invoice', fn ($q) =>$q->where('status', 'issued'))->with('invoice')->firstOrFail();
    }
}
