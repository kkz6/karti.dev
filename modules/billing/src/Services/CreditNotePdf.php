<?php

namespace Modules\Billing\Services;

use Illuminate\Support\Facades\Storage;
use Modules\Billing\Actions\ManageCreditNotes;
use Modules\Billing\Models\CreditNote;
use Modules\Billing\Models\Invoice;

class CreditNotePdf
{
    public function document(CreditNote $note): array
    {
        $source=Invoice::findOrFail($note->invoice_id);
        $credit=app(CreditNotePresentation::class)->data($note);
        if ($note->status === 'draft') {
            $allocation        =app(ManageCreditNotes::class)->review($note)['allocation'];
            $credit['subtotal']=InvoiceCalculator::money((string) $allocation['subtotal_minor'], $note->currency_precision);
            $credit['taxes']   =array_map(fn ($t) =>['name'=>$t['name'], 'percentage'=>$t['percentage'], 'amount'=>InvoiceCalculator::money((string) $t['amount_minor'], $note->currency_precision)], $allocation['taxes']);
        }
        $item   =['key'=>'credit', 'description'=>'Credit adjustment for '.$source->formatted_number, 'additional_description'=>$note->reason, 'unit'=>'credit', 'quantity'=>'1.0000', 'rate'=>$credit['subtotal'], 'gross'=>$credit['subtotal'], 'taxes'=>array_map(fn ($t) =>[...$t, 'tax_rate_id'=>null], $credit['taxes'])];
        $invoice=['status'=>$note->status, 'formatted_number'=>$note->formatted_number, 'invoice_date'=>$note->credit_date->format('Y-m-d'), 'due_date'=>null, 'currency'=>$note->currency, 'discount_mode'=>'none', 'discount_value'=>'0', 'customer_note'=>'Credit amounts are allocated proportionally from the original invoice net and tax amounts, including original discounts.', 'terms'=>'', 'payment_instructions'=>'', 'items'=>[$item], 'totals'=>['precision'=>$note->currency_precision, 'subtotal'=>$credit['subtotal'], 'discount'=>InvoiceCalculator::money('0', $note->currency_precision), 'total'=>$credit['total'], 'tax_groups'=>$credit['taxes']]];
        $label  =$note->formatted_number ?? 'Draft credit #'.$note->id;
        $data   =['documentType'=>'credit_note', 'creditSettlement'=>$credit['settlement'], 'sourceNumber'=>$source->formatted_number, 'invoice'=>$invoice, 'label'=>$label, 'logo'=>app(InvoicePdf::class)->data($source)['logo'], 'sellerLines'=>InvoicePdfLayout::party($note->seller_snapshot), 'customerLines'=>InvoicePdfLayout::party($note->customer_snapshot, true), 'rows'=>InvoicePdfLayout::rows([$item]), 'payments'=>[], 'settlement'=>['state'=>'issued']];
        $bytes  =app(DompdfDocumentRenderer::class)->render('billing::pdf.invoice', $data, $label);
        $name   =($note->status === 'draft' ? 'draft-' : '').preg_replace('/[^A-Za-z0-9._-]/', '-', $label).'.pdf';
        if ($note->status !== 'draft') {
            $hash=hash('sha256', $bytes);
            if (! Storage::disk('local')->put('billing/credits/'.$note->id.'/pdf/'.$hash.'.pdf', $bytes, ['visibility'=>'private'])) {
                throw new \RuntimeException('Unable to store credit PDF.');
            }
        }

        return ['bytes'=>$bytes, 'name'=>$name];
    }
}
