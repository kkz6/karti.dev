<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Modules\Billing\Actions\ManagePayments;
use Modules\Billing\Http\Requests\RecordPaymentRequest;
use Modules\Billing\Http\Requests\ReversePaymentRequest;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Shared\Http\Controllers\BaseController;

class PaymentsController extends BaseController
{
    public function index(\Illuminate\Http\Request $request): \Inertia\Response
    {
        $this->authorize('viewAny', Payment::class);
        $this->authorize('view', new Payment);
        $request->validate(['search' => ['nullable', 'string', 'max:255']]);

        return \Inertia\Inertia::render('billing::payments/index', ['table' => \Modules\Billing\Tables\Payments::make()->setRequest($request)]);
    }

    public function store(RecordPaymentRequest $request, Invoice $invoice, ManagePayments $action): RedirectResponse
    {
        $action->record($invoice, $request->validated(), $request->user());

        return ($request->header('X-Customer-Context') === (string) $invoice->customer_id ? to_route('admin.customers.show', $invoice->customer_id) : to_route('admin.invoices.show', $invoice))->with('billing_message', 'Payment recorded. The balance is up to date.');
    }

    public function reverse(ReversePaymentRequest $request, Payment $payment, ManagePayments $action): RedirectResponse
    {
        $action->reverse($payment, $request->validated(), $request->user());

        return to_route('admin.invoices.show', $payment->invoice_id)->with('billing_message', 'Payment reversed. Its history is preserved and the balance is restored.');
    }
}
