<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\CreateInvoiceCheckout;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Contracts\PaymentProvider;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\OnlineCheckout;
use Modules\Billing\Models\Payment;
use Modules\Billing\Models\ProviderEvent;
use Modules\Billing\Services\ReconcileProviderPayment;
use Modules\Billing\Settings\BillingProviderSettings;
use Modules\Frontend\Models\ConsultationBooking;
use Modules\Frontend\Services\CalComService;

uses(RefreshDatabase::class);
beforeEach(function () {
    Queue::fake();
    $this->admin=User::factory()->create()->assignRole('admin');
    $this->actingAs($this->admin);
    $customer     =Customer::factory()->create();
    $this->invoice=app(SaveInvoiceDraft::class)->handle(['customer_id'=>$customer->id, 'invoice_date'=>now()->subDay()->format('Y-m-d'), 'currency'=>'INR', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>(string) Str::uuid(), 'description'=>'Service', 'unit'=>'hour', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]]]);
    $this->invoice->forceFill(['status'=>'issued', 'formatted_number'=>'INV-000001'])->save();
    app(BillingProviderSettings::class)->fill(['invoice_checkout_enabled'=>true, 'invoice_product_id'=>'test-product', 'document_policy_confirmed'=>true])->save();
    $this->provider=new class implements PaymentProvider
    {
        public array $paymentData=[];

        public int $created=0;

        public function payment(string $id): array
        {
            return $this->paymentData;
        }

        public function invoiceCheckout(OnlineCheckout $checkout): array
        {
            $this->created++;

            return ['session_id'=>'session-test', 'url'=>'https://checkout.dodopayments.com/test'];
        }

        public function checkoutPaymentId(string $sessionId): ?string
        {
            return null;
        }
    };
    app()->instance(PaymentProvider::class, $this->provider);
    $this->checkout             =app(CreateInvoiceCheckout::class)->handle($this->invoice, (string) Str::uuid(), 'https://example.test/invoice');
    $this->provider->paymentData=['id'=>'pay-test', 'status'=>'succeeded', 'amount'=>10000, 'currency'=>'INR', 'metadata'=>['billing_checkout_id'=>$this->checkout->public_id]];
});
test('verified exact provider payment records once while checkout retries reuse the session', function () {
    $again=app(CreateInvoiceCheckout::class)->handle($this->invoice, (string) Str::uuid(), 'https://example.test/invoice');
    expect($again->id)->toBe($this->checkout->id)->and($this->provider->created)->toBe(1);
    expect(app(ReconcileProviderPayment::class)->handle('pay-test'))->toBe('processed');
    expect(app(ReconcileProviderPayment::class)->handle('pay-test'))->toBe('processed');
    expect(Payment::count())->toBe(1)->and(Payment::first()->provider_payment_id)->toBe('pay-test')->and($this->checkout->fresh()->state)->toBe('paid');
});
test('pending failed mismatched and cancelled provider states never settle invoices', function (string $change) {
    if (in_array($change, ['pending', 'failed'])) {
        $this->provider->paymentData['status']=$change;
    } elseif ($change === 'currency') {
        $this->provider->paymentData['currency']='USD';
    } elseif ($change === 'amount') {
        $this->provider->paymentData['amount']=9999;
    } else {
        $this->invoice->forceFill(['status'=>'cancelled'])->save();
    }
    app(ReconcileProviderPayment::class)->handle('pay-test');
    expect(Payment::count())->toBe(0)->and($this->checkout->fresh()->state)->not->toBe('paid');
})->with(['pending', 'failed', 'currency', 'amount', 'cancelled']);
test('payment return is readonly and cannot prove a successful payment', function () {
    auth()->logout();
    $this->get(route('billing.payment-return', $this->checkout->public_id).'?payment_status=succeeded')->assertOk()->assertInertia(fn (Assert $page) =>$page->component('billing::payment-return')->where('state', 'pending'));
    expect(Payment::count())->toBe(0);
});
test('authenticated webhook signatures and persistent event identities reject spoofing and deduplicate events', function () {
    $secret='whsec_'.base64_encode(random_bytes(32));
    config(['services.dodo_payments.webhook_key'=>$secret]);
    $body     =json_encode(['type'=>'payment.succeeded', 'data'=>['payment_id'=>'pay-test']]);
    $timestamp=time();
    $signer   =new \StandardWebhooks\Webhook($secret);
    $headers  =['CONTENT_TYPE'=>'application/json', 'HTTP_WEBHOOK_ID'=>'event-test', 'HTTP_WEBHOOK_TIMESTAMP'=>(string) $timestamp, 'HTTP_WEBHOOK_SIGNATURE'=>$signer->sign('event-test', $timestamp, $body)];
    $this->call('POST', route('billing.webhooks.dodo'), [], [], [], $headers, $body)->assertOk();
    $this->call('POST', route('billing.webhooks.dodo'), [], [], [], $headers, $body)->assertOk();
    expect(ProviderEvent::count())->toBe(1);
    $headers['HTTP_WEBHOOK_SIGNATURE']='v1,invalid';
    $this->call('POST', route('billing.webhooks.dodo'), [], [], [], $headers, $body)->assertUnauthorized();
    (new \Modules\Billing\Jobs\ProcessProviderEvent(ProviderEvent::first()->id))->handle();
    expect(Payment::count())->toBe(1)->and(ProviderEvent::first()->state)->toBe('processed');
});
test('booking returns require an opaque capability and never invoke calendar confirmation', function () {
    $token   =bin2hex(random_bytes(32));
    $booking =ConsultationBooking::create(['name'=>'Demo', 'email'=>'demo@example.test', 'profession'=>'Developer', 'slot_start'=>now()->addDay(), 'timezone'=>'Asia/Kolkata', 'return_token_hash'=>hash('sha256', $token)]);
    $calendar=Mockery::mock(CalComService::class);
    $calendar->shouldNotReceive('createBooking');
    app()->instance(CalComService::class, $calendar);
    auth()->logout();
    $this->get(route('upwork.bookingConfirmed', ['booking'=>$booking->id, 'token'=>$token, 'payment_status'=>'succeeded']))->assertOk()->assertInertia(fn (Assert $page) =>$page->where('state', 'pending'));
    expect($booking->fresh()->status)->toBe('pending')->and($booking->fresh()->paid_at)->toBeNull();
    $this->get(route('upwork.bookingConfirmed', ['booking'=>$booking->id]))->assertNotFound();
});

test('a second provider charge on the same checkout is flagged for review rather than silently reused', function () {
    app(ReconcileProviderPayment::class)->handle('pay-test');
    $this->provider->paymentData['id']='pay-second';
    expect(app(ReconcileProviderPayment::class)->handle('pay-second'))->toBe('needs_review')->and(Payment::count())->toBe(1)->and($this->checkout->fresh()->state)->toBe('needs_review');
    $this->postJson(route('admin.payments.reverse', Payment::first()), ['version'=>$this->invoice->fresh()->version, 'reason'=>'Wrong charge'])->assertJsonValidationErrors('reason');
});

test('a refunded provider state received before successful reconciliation requires review and does not mark paid', function () {
    $this->provider->paymentData['refunded']=true;
    expect(app(ReconcileProviderPayment::class)->handle('pay-test'))->toBe('needs_review')->and(Payment::count())->toBe(0)->and($this->checkout->fresh()->state)->toBe('needs_review');
});
