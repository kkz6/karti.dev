<?php

namespace Modules\Billing\Http\Controllers;

use DateTimeZone;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\RecurringInvoice;
use Modules\Billing\Services\RecurringInvoiceGenerator;
use Modules\Billing\Settings\BillingSettings;
use Modules\Shared\Http\Controllers\BaseController;

class RecurringInvoicesController extends BaseController
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', RecurringInvoice::class);
        $this->authorize('viewAny', Invoice::class);
        $this->authorize('view', new Invoice);

        return Inertia::render('billing::recurring/index', ['table'=>\Modules\Billing\Tables\RecurringInvoices::make()->setRequest($request), 'canCreate'=>$request->user()->can('create', RecurringInvoice::class)]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', RecurringInvoice::class);
        $this->authorize('create', Invoice::class);

        return $this->form($request);
    }

    public function edit(Request $request, RecurringInvoice $recurringInvoice)
    {
        $this->authorize('view', $recurringInvoice);
        $this->authorize('view', Invoice::findOrFail($recurringInvoice->source_invoice_id));

        return $this->form($request, $recurringInvoice);
    }

    private function form(Request $request, ?RecurringInvoice $schedule=null)
    {
        $sources=Invoice::whereIn('status', ['draft', 'issued'])->latest('id')->limit(30)->get(['id', 'formatted_number', 'customer_name']);
        if ($schedule && ! $sources->contains('id', $schedule->source_invoice_id)) {
            $sources->push(Invoice::findOrFail($schedule->source_invoice_id));
        }

        $data=['schedule'=>$schedule, 'sources'=>$sources, 'timezones'=>DateTimeZone::listIdentifiers(), 'defaultTimezone'=>app(BillingSettings::class)->timezone, 'canUpdate'=>$schedule ? $request->user()->can('update', $schedule) : true, 'occurrences'=>$schedule ? DB::table('billing_recurrence_occurrences')->where('recurring_invoice_id', $schedule->id)->latest('scheduled_date')->limit(100)->get() : [], 'message'=>$request->session()->get('billing_message')];

        return $request->expectsJson() ? response()->json($data) : Inertia::render('billing::recurring/form', $data);
    }

    public function store(Request $request)
    {
        $this->authorize('create', RecurringInvoice::class);

        return $this->save($request);
    }

    public function update(Request $request, RecurringInvoice $recurringInvoice)
    {
        $this->authorize('update', $recurringInvoice);

        return $this->save($request, $recurringInvoice);
    }

    private function save(Request $request, ?RecurringInvoice $schedule=null)
    {
        $this->authorize('create', Invoice::class);
        $data  =$request->validate(['name'=>['required', 'string', 'max:255'], 'source_invoice_id'=>['required', 'integer', 'exists:billing_invoices,id'], 'interval'=>['required', Rule::in(['day', 'week', 'month', 'year'])], 'every'=>['required', 'integer', 'between:1,24'], 'timezone'=>['required', 'timezone'], 'anchor_date'=>['required', 'date_format:Y-m-d'], 'due_days'=>['required', 'integer', 'between:0,365'], 'cycle_limit'=>['nullable', 'integer', 'between:1,1200'], 'policy'=>['required', Rule::in(['draft', 'issue', 'issue_and_send'])], 'active'=>['required', 'boolean'], 'version'=>[$schedule ? 'required' : 'nullable', 'integer', 'min:1']]);
        $source=Invoice::findOrFail($data['source_invoice_id']);
        $this->authorize('view', $source);
        abort_unless(in_array($source->status, ['draft', 'issued'], true), 409, 'Use a draft or issued invoice as a template.');
        if ($data['policy'] !== 'draft') {
            $this->authorize('issue', $source);
        }if ($data['policy'] === 'issue_and_send') {
            $this->authorize('send', $source);
        }
        $saved=DB::transaction(function () use ($schedule, $source, $data, $request) {
            $record=$schedule ? RecurringInvoice::whereKey($schedule->id)->lockForUpdate()->firstOrFail() : new RecurringInvoice;
            if ($record->exists && $record->version !== (int) $data['version']) {
                throw ValidationException::withMessages(['version'=>'The schedule changed. Reload before editing.']);
            }
            if ($record->cycles_done > 0) {
                foreach (['source_invoice_id', 'interval', 'every', 'timezone', 'anchor_date'] as $field) {
                    $old=$field === 'anchor_date' ? $record->anchor_date->format('Y-m-d') : $record->$field;
                    if ((string) $old !== (string) $data[$field]) {
                        throw ValidationException::withMessages([$field=>'Create a new schedule to change timing or template after generation.']);
                    }
                }
            }
            $record->fill($data);
            if (! $record->exists || $record->cycles_done === 0) {
                $record->template =RecurringInvoiceGenerator::template($source);
                $record->next_date=$data['anchor_date'];
            }
            $record->actor_id  =$request->user()->id;
            $record->version   =$record->exists ? $record->version + 1 : 1;
            $record->last_error=null;
            $record->save();

            return $record;
        }, 5);

        if ($request->header('X-Billing-Modal') === '1') {
            return to_route('admin.recurring-invoices.index')->with('billing_message', 'Recurring invoice schedule saved.');
        }

        return to_route('admin.recurring-invoices.edit', $saved)->with('billing_message', 'Recurring invoice schedule saved.');
    }
}
