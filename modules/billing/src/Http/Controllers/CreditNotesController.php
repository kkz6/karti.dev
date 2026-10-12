<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Modules\Billing\Actions\ManageCreditNotes;
use Modules\Billing\Models\CreditAllocation;
use Modules\Billing\Models\CreditNote;
use Modules\Billing\Models\CreditRefund;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Services\CreditNotePresentation;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Services\InvoiceCalculator;
use Modules\Billing\Support\PaymentMethods;
use Modules\Shared\Http\Controllers\BaseController;

class CreditNotesController extends BaseController
{
    public function pdf(Request $request, CreditNote $creditNote)
    {
        $this->authorize('view', $creditNote);
        $this->authorize('view', Invoice::findOrFail($creditNote->invoice_id));
        $this->authorize('download', Invoice::findOrFail($creditNote->invoice_id));
        try {
            $doc=app(\Modules\Billing\Services\CreditNotePdf::class)->document($creditNote);
        } catch (\Throwable $e) {
            report($e);

            return to_route('admin.credit-notes.show', $creditNote)->with('billing_message', 'Credit PDF is temporarily unavailable.');
        }

        return response($doc['bytes'], 200, ['Content-Type'=>'application/pdf', 'Content-Disposition'=>'attachment; filename="'.$doc['name'].'"', 'Cache-Control'=>'private, no-store', 'X-Content-Type-Options'=>'nosniff']);
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', CreditNote::class);
        $this->authorize('view', new Invoice);

        return Inertia::render('billing::credits/index', ['table'=>\Modules\Billing\Tables\CreditNotes::make()->setRequest($request), 'canViewInvoices'=>$request->user()->can('viewAny', Invoice::class)]);
    }

    public function store(Request $request, Invoice $invoice, ManageCreditNotes $action)
    {
        $this->authorize('view', $invoice);
        $this->authorize('create', CreditNote::class);
        $data  =$request->validate(['request_key'=>['required', 'uuid'], 'amount'=>['required', 'string', 'max:24', 'regex:/^\d+(?:\.\d{1,4})?$/'], 'credit_date'=>['required', 'date_format:Y-m-d'], 'reason'=>['required', 'string', 'min:3', 'max:2000']]);
        $credit=$action->create($invoice, $data, $request->user());

        return to_route('admin.credit-notes.show', $credit)->with('billing_message', 'Credit note draft created. Review and issue before allocating or refunding.');
    }

    public function show(Request $request, CreditNote $creditNote, ManageCreditNotes $action)
    {
        $this->authorize('view', $creditNote);
        $this->authorize('view', Invoice::findOrFail($creditNote->invoice_id));
        $review     =null;
        $reviewError=null;
        if ($creditNote->status === 'draft') {
            try {
                $review=$action->review($creditNote);
            } catch (\Illuminate\Validation\ValidationException $e) {
                $reviewError=collect($e->errors())->flatten()->first();
            }
        }
        $invoices=Invoice::where('customer_id', $creditNote->customer_id)->where('currency', $creditNote->currency)->where('status', 'issued')->with(['payments', 'creditAllocations.creditNote'])->get()->filter(fn ($i) =>app(InvoiceBalance::class)->data($i)['can_receive'])->map(fn ($i) =>['id'=>$i->id, 'number'=>$i->formatted_number, 'balance'=>app(InvoiceBalance::class)->data($i)['balance']])->values();
        $data    =app(CreditNotePresentation::class)->data($creditNote);
        if ($review) {
            $data['subtotal']=InvoiceCalculator::money((string) $review['allocation']['subtotal_minor'], $creditNote->currency_precision);
            $data['taxes']   =array_map(fn ($t) =>['name'=>$t['name'], 'percentage'=>$t['percentage'], 'amount'=>InvoiceCalculator::money((string) $t['amount_minor'], $creditNote->currency_precision)], $review['allocation']['taxes']);
        }

        return Inertia::render('billing::credits/show', ['credit'=>$data, 'reviewToken'=>$review['token'] ?? null, 'reviewError'=>$reviewError, 'invoices'=>$invoices, 'allocations'=>$creditNote->allocations()->latest('id')->get()->map(fn ($a) =>['id'=>$a->id, 'invoice_id'=>$a->invoice_id, 'amount'=>InvoiceCalculator::money((string) $a->amount_minor, $creditNote->currency_precision), 'reversed_at'=>$a->reversed_at?->toIso8601String(), 'reversal_reason'=>$a->reversal_reason, 'actor'=>$a->actor_name]), 'refunds'=>$creditNote->refunds()->latest('id')->get()->map(fn ($x) =>['id'=>$x->id, 'amount'=>InvoiceCalculator::money((string) $x->amount_minor, $creditNote->currency_precision), 'refund_date'=>$x->refund_date->format('Y-m-d'), 'method'=>$x->method_label, 'reference'=>$x->reference, 'reason'=>$x->reason, 'reversed_at'=>$x->reversed_at?->toIso8601String(), 'reversal_reason'=>$x->reversal_reason, 'actor'=>$x->actor_name]), 'methods'=>PaymentMethods::options(), 'can'=>collect(['update', 'issue', 'allocate', 'reverse allocation', 'refund', 'cancel'])->mapWithKeys(fn ($ability) =>[$ability=>$request->user()->can($ability, $creditNote)])->all(), 'today'=>now(app(\Modules\Billing\Settings\BillingSettings::class)->timezone)->format('Y-m-d'), 'message'=>$request->session()->get('billing_message')]);
    }

    public function update(Request $request, CreditNote $creditNote, ManageCreditNotes $action)
    {
        $this->authorize('update', $creditNote);
        $data=$request->validate(['version'=>['required', 'integer'], 'reason'=>['required', 'string', 'min:3', 'max:2000']]);
        \Illuminate\Support\Facades\DB::transaction(function () use ($creditNote, $data) {
            $locked=CreditNote::whereKey($creditNote->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->status === 'draft', 409);
            if ($locked->version !== (int) $data['version']) {
                throw \Illuminate\Validation\ValidationException::withMessages(['version'=>'Credit changed. Reload before editing.']);
            }$locked->update(['reason'=>$data['reason'], 'version'=>$locked->version + 1]);
        });

        return back()->with('billing_message', 'Draft credit reason updated.');
    }

    public function issue(Request $request, CreditNote $creditNote, ManageCreditNotes $action)
    {
        $this->authorize('issue', $creditNote);
        $data=$request->validate(['version'=>['required', 'integer', 'min:1'], 'review_token'=>['required', 'string', 'size:64']]);
        $action->issue($creditNote, $data, $request->user());

        return back()->with('billing_message', 'Credit note issued. Its number and original billing identity are preserved.');
    }

    public function allocate(Request $request, CreditNote $creditNote, ManageCreditNotes $action)
    {
        $this->authorize('allocate', $creditNote);
        $data   =$request->validate(['invoice_id'=>['required', 'integer', 'exists:billing_invoices,id'], 'amount'=>['required', 'string', 'max:24', 'regex:/^\d+(?:\.\d{1,4})?$/'], 'request_key'=>['required', 'uuid']]);
        $invoice=Invoice::findOrFail($data['invoice_id']);
        $this->authorize('view', $invoice);
        $action->allocate($creditNote, $invoice, $data, $request->user());

        return back()->with('billing_message', 'Credit allocated to the invoice.');
    }

    public function reverseAllocation(Request $request, CreditNote $creditNote, CreditAllocation $allocation, ManageCreditNotes $action)
    {
        $this->authorize('reverse allocation', $creditNote);
        abort_unless($allocation->credit_note_id === $creditNote->id, 404);
        $data=$request->validate(['reason'=>['required', 'string', 'min:3', 'max:2000']]);
        $action->reverseAllocation($allocation, $data['reason'], $request->user());

        return back()->with('billing_message', 'Allocation reversed. Credit availability and invoice balance are restored.');
    }

    public function refund(Request $request, CreditNote $creditNote, ManageCreditNotes $action)
    {
        $this->authorize('refund', $creditNote);
        $data                =$request->validate(['amount'=>['required', 'string', 'max:24', 'regex:/^\d+(?:\.\d{1,4})?$/'], 'refund_date'=>['required', 'date_format:Y-m-d'], 'method'=>['required', Rule::in(array_column(PaymentMethods::options(false), 'value'))], 'reference'=>['nullable', 'string', 'max:255'], 'reason'=>['required', 'string', 'min:3', 'max:2000'], 'request_key'=>['required', 'uuid']]);
        $data['method_label']=\Modules\Billing\Models\PaymentMethod::where('code', $data['method'])->firstOrFail()->name;
        $action->refund($creditNote, $data, $request->user());

        return back()->with('billing_message', 'Refund already made was recorded. No external provider refund was initiated.');
    }

    public function reverseRefund(Request $request, CreditNote $creditNote, CreditRefund $refund, ManageCreditNotes $action)
    {
        $this->authorize('refund', $creditNote);
        abort_unless($refund->credit_note_id === $creditNote->id, 404);
        $data=$request->validate(['reason'=>['required', 'string', 'min:3', 'max:2000']]);
        $action->reverseRefund($refund, $data['reason'], $request->user());

        return back()->with('billing_message', 'Refund record reversed.');
    }

    public function cancel(Request $request, CreditNote $creditNote, ManageCreditNotes $action)
    {
        $this->authorize('cancel', $creditNote);
        $data=$request->validate(['reason'=>['required', 'string', 'min:3', 'max:2000']]);
        $action->cancel($creditNote, $data['reason'], $request->user());

        return back()->with('billing_message', 'Credit cancelled; its number and history remain.');
    }
}
