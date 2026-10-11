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
        $data=$request->validate(['reminders_enabled'=>['required', 'boolean'], 'reminder_offsets'=>['required', 'array', 'min:1', 'max:10'], 'reminder_offsets.*'=>['integer', 'distinct', 'between:0,365']]);
        if ($data['reminders_enabled']) {
            $this->authorize('send', new Invoice);
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
