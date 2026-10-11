<?php

namespace Modules\Billing\Services;

use Modules\Billing\Models\CreditNote;

class CreditNotePresentation
{
    public function data(CreditNote $note): array
    {
        return [...$note->only(['id', 'invoice_id', 'customer_id', 'currency', 'currency_precision', 'status', 'formatted_number', 'reason', 'version', 'cancellation_reason']),
            'credit_date'=> $note->credit_date->format('Y-m-d'), 'seller_snapshot'=>\Illuminate\Support\Arr::except($note->seller_snapshot, ['logo_file', 'logo_media_id']), 'customer_snapshot'=>\Illuminate\Support\Arr::except($note->customer_snapshot, ['contacts']),
            'total'      => InvoiceCalculator::money((string) $note->total_minor, $note->currency_precision), 'subtotal'=>InvoiceCalculator::money((string) $note->subtotal_minor, $note->currency_precision),
            'taxes'      => array_map(fn ($t) =>['name'=>$t['name'], 'percentage'=>$t['percentage'], 'amount'=>InvoiceCalculator::money((string) $t['amount_minor'], $note->currency_precision)], $note->taxes), 'settlement'=>app(CreditBalance::class)->data($note)];
    }
}
