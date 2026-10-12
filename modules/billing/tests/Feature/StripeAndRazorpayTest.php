<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\CreateInvoiceCheckout;
use Modules\Billing\Actions\ManageInvoiceLinks;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Jobs\ProcessProviderEvent;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\OnlineCheckout;
use Modules\Billing\Models\Payment;
use Modules\Billing\Models\ProviderEvent;
use Modules\Billing\Services\PaymentGatewayRegistry;
use Modules\Billing\Services\ReconcileProviderPayment;
use Modules\Billing\Settings\BillingProviderSettings;

uses(RefreshDatabase::class);
beforeEach(function () {
    config(['inertia.ssr.enabled'=>false]);
    Http::preventStrayRequests();
    Queue::fake();
    $this->actingAs(User::factory()->create()->assignRole('admin'));
    $this->invoice = app(SaveInvoiceDraft::class)->handle(['customer_id'=>Customer::factory()->create()->id, 'invoice_date'=>now()->subDay()->format('Y-m-d'), 'currency'=>'INR', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>(string) Str::uuid(), 'description'=>'Service', 'unit'=>'item', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]]]);
    $this->invoice->forceFill(['status'=>'issued', 'formatted_number'=>'INV-000001'])->save();
    $this->settings = app(BillingProviderSettings::class);
    $this->settings->fill(['provider_settings'=>['stripe'=>['secret_key'=>'sk_test_example', 'webhook_secret'=>'whsec_example'], 'razorpay'=>['key_id'=>'rzp_test_example', 'key_secret'=>'rzp_secret', 'webhook_secret'=>'rzp_webhook']]])->save();
});
function fakeInvoiceProviderResponses(array $responses): void
{
    Http::swap(new \Illuminate\Http\Client\Factory);
    Http::preventStrayRequests();
    Http::fake($responses);
}
function enableInvoiceGateway(string $id): void
{
    app(BillingProviderSettings::class)->fill(['default_provider'=>$id, 'enabled_providers'=>[$id], 'invoice_checkout_enabled'=>true, 'document_policy_confirmed'=>true])->save();
}
function signedInvoiceWebhook(string $id, array $payload, bool $valid = true)
{
    $raw       = json_encode($payload);
    $signature = $id === 'stripe'
        ? 't='.now()->timestamp.',v1='.hash_hmac('sha256', now()->timestamp.'.'.$raw, 'whsec_example')
        : hash_hmac('sha256', $raw, 'rzp_webhook');

    return test()->call('POST', route('billing.webhooks.provider', $id), [], [], [], ['CONTENT_TYPE'=>'application/json', $id === 'stripe' ? 'HTTP_STRIPE_SIGNATURE' : 'HTTP_X_RAZORPAY_SIGNATURE'=>$valid ? $signature : 'wrong'], $raw);
}

test('Stripe and Razorpay packages are discovered but start disabled', function () {
    $registry = app(PaymentGatewayRegistry::class);
    expect($registry->get('stripe')->name())->toBe('Stripe')->and($registry->get('razorpay')->name())->toBe('Razorpay');
    expect($registry->enabled('stripe'))->toBeFalse()->and($registry->enabled('razorpay'))->toBeFalse();
});

test('Stripe checkout uses exact minor amounts idempotency and verified callbacks', function () {
    enableInvoiceGateway('stripe');
    fakeInvoiceProviderResponses([
        'api.stripe.com/v1/checkout/sessions'          => Http::response(['id'=>'cs_test_example', 'url'=>'https://checkout.stripe.com/c/pay/example']),
        'api.stripe.com/v1/payment_intents/pi_example*'=> Http::response(['id'=>'pi_example', 'status'=>'succeeded', 'amount_received'=>10000, 'currency'=>'inr', 'metadata'=>[], 'latest_charge'=>['amount_refunded'=>0]]),
    ]);
    $checkout = app(CreateInvoiceCheckout::class)->handle($this->invoice, (string) Str::uuid(), 'https://example.test/invoice');
    Http::assertSent(fn ($request) => $request->method() === 'POST' && (int) $request['line_items'][0]['price_data']['unit_amount'] === 10000 && $request['payment_intent_data']['metadata']['billing_checkout_id'] === $checkout->public_id && $request->hasHeader('Idempotency-Key', $checkout->request_key));
    fakeInvoiceProviderResponses(['api.stripe.com/v1/payment_intents/pi_example*'=>Http::response(['id'=>'pi_example', 'status'=>'succeeded', 'amount_received'=>10000, 'currency'=>'inr', 'metadata'=>['billing_checkout_id'=>$checkout->public_id], 'latest_charge'=>['amount_refunded'=>0]])]);
    $payload = ['id'=>'evt_example', 'type'=>'payment_intent.succeeded', 'data'=>['object'=>['id'=>'pi_example']]];
    signedInvoiceWebhook('stripe', $payload, false)->assertUnauthorized();
    signedInvoiceWebhook('stripe', $payload)->assertOk();
    signedInvoiceWebhook('stripe', $payload)->assertOk();
    expect(ProviderEvent::count())->toBe(1);
    (new ProcessProviderEvent(ProviderEvent::first()->id))->handle();
    (new ProcessProviderEvent(ProviderEvent::first()->id))->handle();
    expect(Payment::count())->toBe(1)->and(Payment::first()->provider)->toBe('stripe')->and($checkout->fresh()->state)->toBe('paid');
});

test('Stripe rejects expired signatures and mismatching amounts and detects partial refunds', function () {
    enableInvoiceGateway('stripe');
    $checkout = OnlineCheckout::create(['provider'=>'stripe', 'invoice_id'=>$this->invoice->id, 'public_id'=>(string) Str::uuid(), 'request_key'=>(string) Str::uuid(), 'expected_minor'=>10000, 'currency'=>'INR', 'invoice_url'=>'https://example.test', 'state'=>'pending']);
    $data     = ['id'=>'pi_example', 'status'=>'succeeded', 'amount_received'=>9999, 'currency'=>'inr', 'metadata'=>['billing_checkout_id'=>$checkout->public_id], 'latest_charge'=>['amount_refunded'=>0]];
    fakeInvoiceProviderResponses(['api.stripe.com/*'=>Http::response($data)]);
    expect(app(ReconcileProviderPayment::class)->handle('pi_example', 'stripe'))->toBe('needs_review');
    expect(Payment::count())->toBe(0);
    fakeInvoiceProviderResponses(['api.stripe.com/*'=>Http::response([...$data, 'amount_received'=>10000, 'latest_charge'=>['amount_refunded'=>500]])]);
    expect(app(ReconcileProviderPayment::class)->handle('pi_example', 'stripe'))->toBe('needs_review');
    $raw = json_encode(['id'=>'evt_old', 'type'=>'payment_intent.succeeded']);
    $old = now()->subMinutes(10)->timestamp;
    $this->call('POST', route('billing.webhooks.provider', 'stripe'), [], [], [], ['CONTENT_TYPE'=>'application/json', 'HTTP_STRIPE_SIGNATURE'=>'t='.$old.',v1='.hash_hmac('sha256', $old.'.'.$raw, 'whsec_example')], $raw)->assertUnauthorized();
});

test('Razorpay recovers a lost create response and verifies payment belongs to the stored link', function () {
    enableInvoiceGateway('razorpay');
    $publicId = (string) Str::uuid();
    $checkout = OnlineCheckout::create(['provider'=>'razorpay', 'invoice_id'=>$this->invoice->id, 'public_id'=>$publicId, 'request_key'=>(string) Str::uuid(), 'expected_minor'=>10000, 'currency'=>'INR', 'invoice_url'=>'https://example.test', 'state'=>'creating']);
    $link     = ['id'=>'plink_example', 'reference_id'=>$publicId, 'amount'=>10000, 'currency'=>'INR', 'status'=>'created', 'short_url'=>'https://rzp.io/i/example'];
    fakeInvoiceProviderResponses([
        'api.razorpay.com/v1/payment_links?*'=> Http::sequence()->push(['payment_links'=>[]])->push(['payment_links'=>[$link]]),
        'api.razorpay.com/v1/payment_links'  => Http::response([], 500),
    ]);
    $result = app(\Modules\BillingRazorpay\RazorpayPaymentProvider::class)->invoiceCheckout($checkout);
    expect($result['session_id'])->toBe('plink_example');
    Http::assertSent(fn ($request) => $request->method() === 'POST' && $request['reference_id'] === $publicId && $request['amount'] === 10000 && $request['notify'] === ['email'=>false, 'sms'=>false]);
    $checkout->update(['session_id'=>$result['session_id'], 'state'=>'pending']);
    $paidLink = [...$link, 'status'=>'paid', 'payments'=>[['payment_id'=>'pay_example', 'status'=>'captured']]];
    fakeInvoiceProviderResponses([
        'api.razorpay.com/v1/payment_links/plink_example'=> Http::response($paidLink),
        'api.razorpay.com/v1/payments/pay_example'       => Http::response(['id'=>'pay_example', 'status'=>'captured', 'amount'=>10000, 'currency'=>'INR', 'amount_refunded'=>0]),
    ]);
    $payload = ['event'=>'payment_link.paid', 'payload'=>['payment'=>['entity'=>['id'=>'pay_example']], 'payment_link'=>['entity'=>$paidLink]]];
    signedInvoiceWebhook('razorpay', $payload, false)->assertUnauthorized();
    signedInvoiceWebhook('razorpay', $payload)->assertOk();
    (new ProcessProviderEvent(ProviderEvent::first()->id))->handle();
    expect($checkout->fresh()->state)->toBe('paid')->and(Payment::count())->toBe(1)->and(Payment::first()->provider)->toBe('razorpay');
    expect(app(ReconcileProviderPayment::class)->handle('pay_example', 'razorpay', $publicId))->toBe('processed');
    fakeInvoiceProviderResponses(['api.razorpay.com/v1/payments/pay_example'=>Http::response(['id'=>'pay_example', 'status'=>'captured', 'amount'=>10000, 'currency'=>'INR']), 'api.razorpay.com/v1/payment_links/plink_example'=>Http::response([...$paidLink, 'reference_id'=>'another-checkout'])]);
    expect(fn () => app(ReconcileProviderPayment::class)->handle('pay_example', 'razorpay', $publicId))->toThrow(RuntimeException::class);
});

test('customer invoice links open securely and only offer payment when configured and payable', function () {
    $this->post(route('admin.invoices.links.store', $this->invoice), ['days'=>90, 'label'=>'Payment link', 'open'=>true])->assertRedirect();
    $link = app(ManageInvoiceLinks::class)->create($this->invoice);
    $this->get($link['url'])->assertOk()->assertInertia(fn (Assert $page) => $page->where('checkoutUrl', null));
    enableInvoiceGateway('stripe');
    $this->get($link['url'])->assertOk()->assertInertia(fn (Assert $page) => $page->where('checkoutUrl', fn ($url) => is_string($url) && str_ends_with($url, '/checkout')));
    app(BillingProviderSettings::class)->fill(['enabled_providers'=>[]])->save();
    $this->get($link['url'])->assertOk()->assertInertia(fn (Assert $page) => $page->where('checkoutUrl', null));
    enableInvoiceGateway('stripe');
    $this->invoice->forceFill(['status'=>'cancelled'])->save();
    $this->get($link['url'])->assertNotFound();
});
