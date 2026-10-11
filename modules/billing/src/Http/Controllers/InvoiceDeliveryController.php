<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Modules\Billing\Actions\QueueInvoiceDelivery;
use Modules\Billing\Models\Invoice;
use Modules\Shared\Http\Controllers\BaseController;

class InvoiceDeliveryController extends BaseController
{
    public function __invoke(Request $request, Invoice $invoice, QueueInvoiceDelivery $action): RedirectResponse
    {
        $this->authorize('view', $invoice);
        $this->authorize('send', $invoice);
        if (is_string($request->input('request_key'))) {
            $request->merge(['request_key' => strtolower(trim($request->input('request_key')))]);
        }
        $sms   = $request->input('channel', 'email') === 'sms';
        $input = $request->validate([
            'channel'      => ['sometimes', \Illuminate\Validation\Rule::in(['email', 'sms'])],
            'request_key'  => ['required', 'uuid'],
            'recipients'   => ['required', 'array', 'min:1', 'max:'.($sms ? '1' : '10')],
            'recipients.*' => $sms ? ['required', 'string', 'max:50', function ($attribute, $value, $fail) {
                if (! \Modules\Billing\Support\DeliveryTemplates::phone($value)) {
                    $fail('Enter a phone number with its international country code.');
                }
            }] : ['required', 'email:rfc', 'distinct', 'max:254'],
            'subject' => ['required', 'string', 'max:255', 'not_regex:/[\r\n]/'],
            'message' => [$sms ? 'required' : 'nullable', 'string', 'max:'.($sms ? '1600' : '5000')],
        ]);
        $action->handle($invoice, $input, $request->user());

        return to_route('admin.invoices.show', $invoice)->with('billing_message', 'Invoice '.($sms ? 'SMS' : 'email').' queued. Delivery history will update after the billing queue worker runs.');
    }
}
