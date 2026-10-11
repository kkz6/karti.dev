<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Settings\BillingAutomationSettings;
use Modules\Billing\Settings\BillingSettings;
use Modules\Shared\Http\Controllers\BaseController;

class BillingAutomationController extends BaseController
{
    public function edit(Request $request)
    {
        $this->authorize('view', BillingSettings::class);

        return Inertia::render('billing::automation', ['settings'=>app(BillingAutomationSettings::class)->toArray(), 'canUpdate'=>$request->user()->can('update', BillingSettings::class), 'message'=>$request->session()->get('billing_message')]);
    }

    public function update(Request $request)
    {
        $this->authorize('update', BillingSettings::class);
        $data=$request->validate(['reminders_enabled'=>['required', 'boolean'], 'reminder_offsets'=>['required', 'array', 'min:1', 'max:10'], 'reminder_offsets.*'=>['integer', 'distinct', 'between:-30,365']]);
        $data += $request->validate([
            'reminder_email' => ['sometimes', 'boolean'], 'reminder_sms' => ['sometimes', 'boolean'],
            'receipt_email'  => ['sometimes', 'boolean'], 'receipt_sms' => ['sometimes', 'boolean'],
        ]);
        if ($data['reminders_enabled'] || ($data['receipt_email'] ?? false) || ($data['receipt_sms'] ?? false)) {
            $this->authorize('send', new Invoice);
        }
        $delivery = app(\Modules\Billing\Settings\BillingDeliverySettings::class);
        if (($data['reminder_sms'] ?? false) || ($data['receipt_sms'] ?? false)) {
            if (! $delivery->sms_enabled) {
                throw \Illuminate\Validation\ValidationException::withMessages(['reminder_sms' => 'Enable an SMS driver in Delivery settings first.']);
            }
            if ($delivery->sms_provider === 'msg91') {
                $events = [...(($data['reminder_sms'] ?? false) ? ['due', 'overdue'] : []), ...(($data['receipt_sms'] ?? false) ? ['payment'] : [])];
                foreach ($events as $event) {
                    if (empty($delivery->msg91_templates[$event]['id'])) {
                        throw \Illuminate\Validation\ValidationException::withMessages(['reminder_sms' => 'Configure the MSG91 '.$event.' template in Delivery settings first.']);
                    }
                }
            }
        }
        sort($data['reminder_offsets']);
        app(BillingAutomationSettings::class)->fill($data)->save();

        return back()->with('billing_message', 'Reminder settings saved.');
    }

    public function reminder(Request $request, Invoice $invoice)
    {
        $this->authorize('view', $invoice);
        $this->authorize('remind', $invoice);
        $data=$request->validate(['disabled'=>['required', 'boolean']]);
        $invoice->update(['reminders_disabled'=>$data['disabled']]);

        return back()->with('billing_message', 'Invoice reminder preference updated.');
    }
}
