<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Billing\Models\Invoice;
use Modules\Shared\Http\Controllers\BaseController;

class InvoiceInternalNoteController extends BaseController
{
    public function __invoke(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        $this->authorize('update', $invoice);
        $data=$request->validate(['version'=>['required', 'integer', 'min:1'], 'internal_note'=>['nullable', 'string', 'max:10000']]);
        DB::transaction(function () use ($invoice, $data, $request) {
            if (DB::connection()->getDriverName() === 'sqlite') {
                DB::table('billing_invoices')->where('id', $invoice->id)->update(['version'=>DB::raw('version')]);
            }$locked=Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            abort_if($locked->status === 'draft', 409, 'Edit a draft through the draft editor.');
            if (($locked->internal_note ?? '') === ($data['internal_note'] ?? '')) {
                return;
            }if ($locked->version !== (int) $data['version']) {
                throw \Illuminate\Validation\ValidationException::withMessages(['version'=>'Invoice changed. Reload before editing the note.']);
            }$locked->update(['internal_note'=>$data['internal_note'] ?? '']);
            $locked->increment('version');
            $locked->recordActivity('internal_note_updated', 'Internal invoice note updated.', $request->user());
        }, 5);

        return back()->with('billing_message', 'Internal note updated. Issued document details remain unchanged.');
    }
}
