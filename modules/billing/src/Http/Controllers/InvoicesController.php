<?php

namespace Modules\Billing\Http\Controllers;

use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Billing\Actions\CancelInvoice;
use Modules\Billing\Actions\IssueInvoice;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Actions\ValidateDraftReferences;
use Modules\Billing\Http\Requests\CancelInvoiceRequest;
use Modules\Billing\Http\Requests\IssueInvoiceRequest;
use Modules\Billing\Http\Requests\SaveInvoiceRequest;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\TaxRate;
use Modules\Billing\Services\BillingDashboard;
use Modules\Billing\Services\InvoiceCalculator;
use Modules\Billing\Services\InvoiceIssueReview;
use Modules\Billing\Services\InvoicePresentation;
use Modules\Billing\Settings\BillingSettings;
use Modules\Billing\Support\Currencies;
use Modules\Billing\Tables\Invoices;
use Modules\Shared\Http\Controllers\BaseController;

class InvoicesController extends BaseController
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Invoice::class);
        $request->validate(['search' => ['nullable', 'string', 'max:255'], 'invoice'=>['nullable', 'integer', 'exists:billing_invoices,id'], 'edit'=>['nullable', 'integer', 'exists:billing_invoices,id']]);
        $editing=$request->filled('edit') ? Invoice::findOrFail($request->integer('edit')) : null;
        if ($editing) {
            $this->authorize('update', $editing);
            abort_if($editing->status !== 'draft', 409, 'Only draft invoices can be edited.');
        }
        $selected=! $editing && $request->filled('invoice') ? Invoice::findOrFail($request->integer('invoice')) : null;
        if ($selected) {
            $this->authorize('view', $selected);
        }

        return Inertia::render('billing::invoices/index', ['summary' => fn () => app(BillingDashboard::class)->get(includeDrafts: true), 'table' => Invoices::make()->setRequest($request), 'canCreate' => $request->user()->can('create', Invoice::class), 'openComposer' => $request->boolean('compose'), 'editInvoiceId'=>$editing?->id, 'selectedInvoice'=>$selected ? $this->detailData($request, $selected) : null]);
    }

    public function create(Request $request): Response|JsonResponse|RedirectResponse
    {
        $this->authorize('create', Invoice::class);

        if (! $request->expectsJson()) {
            return to_route('admin.invoices.index', ['compose'=>1]);
        }

        return $this->form($request);
    }

    public function createForCustomer(Request $request, Customer $customer): Response|JsonResponse
    {
        $this->authorize('view', $customer);
        $this->authorize('create', Invoice::class);
        abort_if($customer->archived_at !== null, 409, 'Restore this customer before creating an invoice.');

        return $this->form($request, lockedCustomer: $customer);
    }

    public function editForCustomer(Request $request, Customer $customer, Invoice $invoice): Response|JsonResponse
    {
        $this->authorize('view', $customer);
        $this->authorize('update', $invoice);
        abort_unless((int) $invoice->customer_id === (int) $customer->id && $invoice->status === 'draft', 404);

        return $this->form($request, $invoice, lockedCustomer: $customer);
    }

    public function storeForCustomer(SaveInvoiceRequest $request, Customer $customer, SaveInvoiceDraft $action): Response|JsonResponse
    {
        $invoice = $action->handle($request->validated());

        return $this->form($request, $invoice, lockedCustomer: $customer);
    }

    public function updateForCustomer(SaveInvoiceRequest $request, Customer $customer, Invoice $invoice, SaveInvoiceDraft $action): Response|JsonResponse
    {
        abort_unless((int) $invoice->customer_id === (int) $customer->id, 404);
        $invoice = $action->handle($request->validated(), $invoice);

        return $this->form($request, $invoice, lockedCustomer: $customer);
    }

    public function show(Request $request, Invoice $invoice): Response|JsonResponse
    {
        $this->authorize('view', $invoice);

        if ($request->expectsJson()) {
            return response()->json($this->detailData($request, $invoice))->header('Cache-Control', 'private, no-store');
        }

        if ($invoice->status !== 'draft') {
            return Inertia::render('billing::invoices/show', $this->detailData($request, $invoice));
        }

        return Inertia::render('billing::invoices/show', [...$this->detailData($request, $invoice), 'pdfError' => $request->session()->get('billing_pdf_error')]);
    }

    public function edit(Request $request, Invoice $invoice): Response|JsonResponse|RedirectResponse
    {
        $this->authorize('update', $invoice);
        abort_if($invoice->status !== 'draft', 409, 'Only draft invoices can be edited.');

        if ($request->expectsJson()) {
            return $this->form($request, $invoice);
        }
        if ($request->user()->can('viewAny', Invoice::class)) {
            return to_route('admin.invoices.index', ['edit'=>$invoice->id]);
        }

        return Inertia::render('billing::invoices/editor', ['invoiceId'=>$invoice->id]);
    }

    public function customerOptions(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('create', Invoice::class) || $request->user()->can('viewAny', Invoice::class), 403);
        $data  = $request->validate(['search' => ['nullable', 'string', 'max:255']]);
        $query = Customer::whereNull('archived_at');
        if ($search = $data['search'] ?? '') {
            $query->whereRaw("display_name LIKE ? ESCAPE '!'", ['%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search).'%']);
        }

        return response()->json(['customers' => $query->orderBy('display_name')->limit(30)->get(['id', 'display_name', 'default_currency', 'archived_at'])]);
    }

    public function preview(SaveInvoiceRequest $request, InvoiceCalculator $calculator, ValidateDraftReferences $references, ?Invoice $invoice = null): JsonResponse
    {
        $data = $request->validated();
        $references->check($data, $invoice);

        return response()->json($calculator->calculate($data));
    }

    public function store(SaveInvoiceRequest $request, SaveInvoiceDraft $action): RedirectResponse|JsonResponse
    {
        $invoice = $action->handle($request->validated());

        if ($request->expectsJson()) {
            return $this->form($request, $invoice);
        }

        return to_route('admin.invoices.edit', $invoice)->with('billing_message', 'Invoice draft saved.');
    }

    public function update(SaveInvoiceRequest $request, Invoice $invoice, SaveInvoiceDraft $action): RedirectResponse|JsonResponse
    {
        $action->handle($request->validated(), $invoice);

        if ($request->expectsJson()) {
            return $this->form($request, $invoice->fresh());
        }

        return to_route('admin.invoices.edit', $invoice)->with('billing_message', 'Invoice draft updated.');
    }

    public function issueReview(Request $request, Invoice $invoice): Response|RedirectResponse|JsonResponse
    {
        $this->authorize('issue', $invoice);
        if ($invoice->status !== 'draft') {
            return to_route('admin.invoices.show', $invoice);
        }
        $options         = $request->validate(['refresh_seller' => ['sometimes', 'boolean'], 'refresh_customer' => ['sometimes', 'boolean']]);
        $refreshSeller   = $request->boolean('refresh_seller', true);
        $refreshCustomer = $request->boolean('refresh_customer', false);
        $review          = app(InvoiceIssueReview::class)->prepare($invoice, $refreshSeller, $refreshCustomer);
        unset($review['logo']);

        $data=['review' => $review, 'refreshSeller' => $refreshSeller, 'refreshCustomer' => $refreshCustomer, 'canSend' => $request->user()->can('send', $invoice), 'canRecordPayment' => $request->user()->can('record', [\Modules\Billing\Models\Payment::class, $invoice])];

        return $request->expectsJson() ? response()->json($data) : Inertia::render('billing::invoices/issue-review', $data);
    }

    public function issue(IssueInvoiceRequest $request, Invoice $invoice, IssueInvoice $action): RedirectResponse|JsonResponse
    {
        $issued = $action->handle($invoice, $request->validated(), $request->user());

        if ($request->expectsJson()) {
            return response()->json(['invoice'=>app(InvoicePresentation::class)->brandedData($issued), 'url'=>route('admin.invoices.show', $issued)]);
        }

        return to_route('admin.invoices.show', $issued)->with('billing_message', 'Invoice '.$issued->formatted_number.' issued.');
    }

    public function cancel(CancelInvoiceRequest $request, Invoice $invoice, CancelInvoice $action): RedirectResponse
    {
        $cancelled = $action->handle($invoice, $request->validated(), $request->user());

        return to_route('admin.invoices.show', $cancelled)->with('billing_message', 'Invoice cancelled. Its number and history are preserved.');
    }

    private function detailData(Request $request, Invoice $invoice): array
    {
        if ($invoice->status === 'draft') {
            return ['draft'=>true, 'invoice'=>app(InvoicePresentation::class)->brandedData($invoice), 'canUpdate'=>$request->user()->can('update', $invoice), 'canIssue'=>$request->user()->can('issue', $invoice), 'canDownloadPdf'=>$request->user()->can('download', $invoice), 'activities'=>$this->activities($invoice), 'message'=>$request->session()->get('billing_message')];
        }
        $balance    = app(\Modules\Billing\Services\InvoiceBalance::class);
        $settlement = $balance->data($invoice);

        return [
            'canUpdateInternalNote' => $request->user()->can('update', $invoice),
            'canCreateCredit'       => $invoice->status === 'issued' && $request->user()->can('create', \Modules\Billing\Models\CreditNote::class),
            'credits'               => $request->user()->can('view', new \Modules\Billing\Models\CreditNote) ? \Modules\Billing\Models\CreditNote::where('invoice_id', $invoice->id)->latest('id')->get()->map(fn ($c) => app(\Modules\Billing\Services\CreditNotePresentation::class)->data($c))->all() : null,
            'canCheckout'           => $invoice->status === 'issued' && $request->user()->can('checkout', $invoice) && app(\Modules\Billing\Services\PaymentGatewayRegistry::class)->checkoutAvailable(),
            'remindersDisabled'     => $invoice->reminders_disabled, 'canRemind' => $request->user()->can('remind', $invoice),
            'canShare'              => $invoice->status === 'issued' && $request->user()->can('share', $invoice),
            'shareUrl'              => $request->user()->can('share', $invoice) ? $request->session()->get('billing_share_url') : null,
            'links'                 => $request->user()->can('share', $invoice) ? $invoice->links()->latest('id')->get(['id', 'label', 'expires_at', 'revoked_at'])->toArray() : null,
            'canSend'               => $invoice->status === 'issued' && $request->user()->can('send', $invoice),
            'deliveryConfiguration' => $request->user()->can('send', $invoice) ? (function () use ($invoice) {
                $settings                  = app(\Modules\Billing\Settings\BillingDeliverySettings::class);
                $variables                 = \Modules\Billing\Support\DeliveryTemplates::variables($invoice);
                $variables['invoice_link'] = '{invoice_link}';

                return ['smsEnabled' => $settings->sms_enabled, 'smsProvider' => $settings->sms_provider,
                    'smsMessage'     => \Modules\Billing\Support\DeliveryTemplates::render($settings->resolvedTemplates()['invoice']['sms_message'], $variables),
                    'emailSubject'   => \Modules\Billing\Support\DeliveryTemplates::render($settings->resolvedTemplates()['invoice']['email_subject'], $variables),
                    'emailMessage'   => \Modules\Billing\Support\DeliveryTemplates::render($settings->resolvedTemplates()['invoice']['email_message'], $variables)];
            })() : null,
            'deliveries'            => $request->user()->can('send', $invoice) ? \Modules\Billing\Models\InvoiceDelivery::where('invoice_id', $invoice->id)->latest('id')->get()->map(fn ($delivery) => $delivery->only(['id', 'recipients', 'subject', 'kind', 'channel', 'provider', 'state', 'error', 'created_at', 'sent_at', 'provider_reference', 'actor_name']))->all() : null,
            'canDownloadPdf'        => $request->user()->can('download', $invoice), 'pdfError' => $request->session()->get('billing_pdf_error'),
            'settlement'            => $settlement,
            'payments'              => $request->user()->can('view', new \Modules\Billing\Models\Payment) ? $invoice->payments->map(fn ($payment) => [...$balance->paymentData($payment), 'canReverse' => $payment->reversed_at === null && $payment->provider === null && $request->user()->can('reverse', $payment)])->all() : null,
            'canRecordPayment'      => $settlement['can_receive'] && $request->user()->can('record', [\Modules\Billing\Models\Payment::class, $invoice]),
            'paymentMethods'        => \Modules\Billing\Support\PaymentMethods::options(),
            'today'                 => CarbonImmutable::now(app(BillingSettings::class)->timezone)->format('Y-m-d'),
            'invoice'               => app(InvoicePresentation::class)->brandedData($invoice),
            'canCancel'             => $invoice->status === 'issued' && ! $invoice->payments->contains(fn ($payment) => $payment->reversed_at === null) && ! $invoice->creditAllocations()->whereNull('reversed_at')->exists() && ! \Modules\Billing\Models\CreditNote::where('invoice_id', $invoice->id)->where('status', 'issued')->exists() && $request->user()->can('cancel', $invoice),
            'activities'            => $this->activities($invoice), 'message' => $request->session()->get('billing_message'),
        ];
    }

    private function activities(Invoice $invoice): array
    {
        return $invoice->activities()->when(! auth()->user()->can('send', $invoice), fn ($query) => $query->whereNotIn('event', ['email_queued', 'email_accepted']))->when(! auth()->user()->can('view', new \Modules\Billing\Models\Payment), fn ($query) => $query->whereNotIn('event', ['payment_recorded', 'payment_reversed']))->get()->map(fn ($activity) => ['id' => $activity->id, 'event' => $activity->event, 'description' => $activity->description, 'actor' => $activity->actor_name, 'at' => $activity->created_at->toIso8601String()])->all();
    }

    private function form(Request $request, ?Invoice $invoice = null, bool $readOnly = false, ?Customer $lockedCustomer = null): Response|JsonResponse
    {
        $settings  = app(BillingSettings::class);
        $today     = CarbonImmutable::now($settings->timezone)->startOfDay();
        $customers = $readOnly && $invoice
            ? collect([$invoice->customer()->first(['id', 'display_name', 'default_currency', 'archived_at'])])
            : Customer::whereNull('archived_at')->orderBy('display_name')->limit(30)->get(['id', 'display_name', 'default_currency', 'archived_at']);
        if ($invoice && ! $customers->contains('id', $invoice->customer_id)) {
            $customers->push($invoice->customer()->first(['id', 'display_name', 'default_currency', 'archived_at']));
        }
        if ($lockedCustomer) {
            $customers = collect([$lockedCustomer->only(['id', 'display_name', 'default_currency', 'archived_at'])]);
        }
        $draft = $invoice ? $this->draftData($invoice) : null;

        $data = [
            'lockedCustomer'  => $lockedCustomer?->only(['id', 'display_name', 'default_currency', 'archived_at']),
            'invoice'         => $draft, 'customers' => $customers, 'currencies' => Currencies::options(),
            'taxRates'        => $readOnly ? [] : TaxRate::whereNull('archived_at')->orderBy('name')->get(['id', 'name', 'percentage', 'archived_at']),
            'defaults'        => $draft ? ['currency' => $draft['currency'], 'invoice_date' => $draft['invoice_date'], 'due_date' => $draft['due_date'] ?? '', 'terms' => $draft['terms'] ?? '', 'payment_instructions' => $draft['payment_instructions'] ?? ''] : ['currency' => $lockedCustomer?->default_currency ?: $settings->default_currency, 'invoice_date' => $today->format('Y-m-d'), 'due_date' => $today->addDays($settings->due_days)->format('Y-m-d'), 'terms' => $settings->default_terms, 'payment_instructions' => $settings->payment_instructions],
            'canDownloadPdf'  => $invoice && $request->user()->can('download', $invoice), 'pdfError' => $request->session()->get('billing_pdf_error'),
            'readOnly'        => $readOnly, 'canUpdate' => $invoice && $request->user()->can('update', $invoice) && $invoice->status === 'draft',
            'canIssue'        => $request->user()->can('issue', $invoice ?? new Invoice) && (! $invoice || $invoice->status === 'draft'),
            'canSend'         => $request->user()->can('send', $invoice ?? new Invoice),
            'canRecordPayment' => $request->user()->can('record', [\Modules\Billing\Models\Payment::class, $invoice ?? new Invoice]),
            'activities'      => $invoice ? $this->activities($invoice) : [],
            'message'         => $request->session()->get('billing_message'),
        ];

        return $request->expectsJson() ? response()->json($data) : Inertia::render('billing::invoices/form', $data);
    }

    private function draftData(Invoice $invoice): array
    {
        return app(InvoicePresentation::class)->brandedData($invoice);
    }
}
