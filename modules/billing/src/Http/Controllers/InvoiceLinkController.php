<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Modules\Billing\Actions\ManageInvoiceLinks;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\InvoiceLink;
use Modules\Shared\Http\Controllers\BaseController;

class InvoiceLinkController extends BaseController
{
    public function store(Request $request, Invoice $invoice, ManageInvoiceLinks $action): RedirectResponse
    {
        $this->authorize('view', $invoice);
        $this->authorize('share', $invoice);
        $data  =$request->validate(['days'=>['required', 'integer', 'between:1,365'], 'label'=>['nullable', 'string', 'max:100'], 'open'=>['sometimes', 'boolean']]);
        $result=$action->create($invoice, $data['days'], $data['label'] ?? '', $request->user());

        if ($request->boolean('open')) {
            return redirect($result['url']);
        }

        return to_route('admin.invoices.show', $invoice)->with('billing_share_url', $result['url'])->with('billing_message', 'Private invoice link created. Copy it now; its secret is not stored in the link record.');
    }

    public function revoke(Request $request, Invoice $invoice, InvoiceLink $link): RedirectResponse
    {
        $this->authorize('view', $invoice);
        $this->authorize('share', $invoice);
        abort_unless((int) $link->invoice_id === (int) $invoice->id, 404);
        $link->update(['revoked_at'=>$link->revoked_at ?? now()]);

        return to_route('admin.invoices.show', $invoice)->with('billing_message', 'Private invoice link revoked.');
    }
}
