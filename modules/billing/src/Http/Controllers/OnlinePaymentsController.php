<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Billing\Actions\CreateInvoiceCheckout;
use Modules\Billing\Actions\ManageInvoiceLinks;
use Modules\Billing\Jobs\ProcessProviderEvent;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\OnlineCheckout;
use Modules\Billing\Models\ProviderEvent;
use Modules\Billing\Settings\BillingProviderSettings;
use Modules\Billing\Settings\BillingSettings;
use Modules\Frontend\Models\ConsultationBooking;
use Modules\Shared\Http\Controllers\BaseController;

class OnlinePaymentsController extends BaseController
{
    public function settings(Request $request)
    {
        $this->authorize('view', BillingSettings::class);

        return Inertia::render('billing::online-settings', ['settings'=>app(BillingProviderSettings::class)->toArray(), 'apiConfigured'=>config('services.dodo_payments.api_key') !== '', 'webhookConfigured'=>config('services.dodo_payments.webhook_key') !== '', 'testMode'=>(bool) config('services.dodo_payments.test_mode'), 'webhookUrl'=>route('billing.webhooks.dodo'), 'canUpdate'=>$request->user()->can('update', BillingSettings::class), 'message'=>$request->session()->get('billing_message')]);
    }

    public function updateSettings(Request $request)
    {
        $this->authorize('update', BillingSettings::class);
        $data=$request->validate(['invoice_checkout_enabled'=>['required', 'boolean'], 'invoice_product_id'=>['nullable', 'string', 'max:255'], 'document_policy_confirmed'=>['required', 'boolean']]);
        if ($data['invoice_checkout_enabled'] && (! $data['document_policy_confirmed'] || empty($data['invoice_product_id']))) {
            throw \Illuminate\Validation\ValidationException::withMessages(['invoice_checkout_enabled'=>'Confirm the document policy and configure the exact-price product before enabling invoice checkout.']);
        }$data['invoice_product_id'] ??= '';
        app(BillingProviderSettings::class)->fill($data)->save();

        return back()->with('billing_message', 'Online payment settings saved.');
    }

    public function create(Request $request, Invoice $invoice, CreateInvoiceCheckout $action)
    {
        $this->authorize('view', $invoice);
        $this->authorize('checkout', $invoice);
        $data    =$request->validate(['request_key'=>['required', 'uuid']]);
        $link    =app(ManageInvoiceLinks::class)->create($invoice, 90, 'Online checkout', $request->user());
        $checkout=$action->handle($invoice, $data['request_key'], $link['url']);

        return Inertia::location($checkout->checkout_url);
    }

    public function publicCreate(Request $request, string $token, CreateInvoiceCheckout $action)
    {
        $link    =app(ManageInvoiceLinks::class)->resolve($token);
        $data    =$request->validate(['request_key'=>['required', 'uuid']]);
        $checkout=$action->handle($link->invoice, $data['request_key'], route('billing.public-invoice', $token));

        return Inertia::location($checkout->checkout_url);
    }

    public function receipt(Request $request, string $checkout)
    {
        $record=OnlineCheckout::where('public_id', $checkout)->firstOrFail();

        return Inertia::render('billing::payment-return', ['state'=>$record->state, 'invoiceUrl'=>$record->invoice_url])->toResponse($request)->withHeaders(['Cache-Control'=>'private, no-store', 'X-Robots-Tag'=>'noindex, nofollow', 'Referrer-Policy'=>'no-referrer']);
    }

    public function reconciliation(Request $request)
    {
        abort_unless($request->user()->hasRole('super-admin') || $request->user()->can('view payment reconciliation'), 403);

        return Inertia::render('billing::reconciliation', ['checkoutsTable'=>\Modules\Billing\Tables\OnlineCheckouts::make()->as('checkouts')->setRequest($request), 'eventsTable'=>\Modules\Billing\Tables\ProviderEvents::make()->as('events')->setRequest($request), 'onlineEnabled'=>app(BillingProviderSettings::class)->invoice_checkout_enabled, 'canViewSettings'=>$request->user()->can('view', BillingSettings::class), 'message'=>$request->session()->get('billing_message')]);
    }

    public function retry(Request $request, ProviderEvent $event)
    {
        abort_unless($request->user()->hasRole('super-admin') || $request->user()->can('view payment reconciliation'), 403);
        abort_unless(in_array($event->state, ['failed', 'pending'], true), 409, 'This event is already processed or requires manual review.');
        ProcessProviderEvent::dispatch($event->id)->onQueue('billing');

        return back()->with('billing_message', 'Provider event queued for verification.');
    }

    public function associate(Request $request, ConsultationBooking $booking)
    {
        abort_unless($request->user()->hasRole('super-admin') || $request->user()->can('link consultation customer'), 403);
        $data    =$request->validate(['customer_id'=>['required', 'integer', 'exists:billing_customers,id']]);
        $customer=Customer::findOrFail($data['customer_id']);
        $this->authorize('view', $customer);
        abort_if($customer->archived_at, 409, 'Restore the customer first.');
        $booking->update(['billing_customer_id'=>$customer->id]);

        return back()->with('billing_message', 'Booking associated with the selected customer. No customer was merged and no duplicate invoice was generated.');
    }
}
