<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\CreateInvoiceCheckout;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Contracts\PaymentGateway;
use Modules\Billing\Contracts\PaymentProvider;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\OnlineCheckout;
use Modules\Billing\Models\Payment;
use Modules\Billing\Models\ProviderEvent;
use Modules\Billing\Services\PaymentGatewayRegistry;
use Modules\Billing\Services\ReconcileProviderPayment;
use Modules\Billing\Settings\BillingProviderSettings;

uses(RefreshDatabase::class);
class PackageExampleAdapter implements PaymentProvider
{
    public array $paymentData=[];

    public function payment(string $id): array
    {
        return $this->paymentData;
    }

    public function invoiceCheckout(OnlineCheckout $checkout): array
    {
        return ['session_id'=>'example-session', 'url'=>'https://checkout.example.test/pay'];
    }

    public function checkoutPaymentId(string $id): ?string
    {
        return 'example-payment';
    }
}
class PackageExampleGateway implements PaymentGateway
{
    public function id(): string
    {
        return 'example';
    }

    public function name(): string
    {
        return 'Example Payments';
    }

    public function providerClass(): string
    {
        return PackageExampleAdapter::class;
    }

    public function fields(): array
    {
        return ['secret'=>['label'=>'API key', 'type'=>'password', 'required'=>true, 'default'=>'']];
    }

    public function checkoutHosts(): array
    {
        return ['checkout.example.test'];
    }

    public function verifyWebhook(Request $request): array
    {
        abort_unless($request->header('example-signature') === 'signed', 401);

        return ['event_id'=>'example-event', 'event_type'=>'payment.succeeded', 'payload'=>['data'=>['payment_id'=>'example-payment']]];
    }
}

beforeEach(function () {
    Queue::fake();
    config(['inertia.ssr.enabled'=>false]);
    $this->actingAs(User::factory()->create()->assignRole('admin'));
    $this->registry=app(PaymentGatewayRegistry::class);
    $this->registry->register(new PackageExampleGateway);
    $this->adapter=new PackageExampleAdapter;
    app()->instance(PackageExampleAdapter::class, $this->adapter);
});

test('Composer auto-discovers the installed Dodo gateway and additional packages appear in settings', function () {
    expect($this->registry->get('dodo')->name())->toBe('Dodo Payments');
    $this->get(route('admin.settings.billing.edit', ['section'=>'online']))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->has('providers', 4)->where('providers.0.id', 'dodo')->where('providers.3.id', 'example')->missing('settings.provider_settings')->where('providers.3.fields.secret.value', ''));
    expect(fn () =>$this->registry->register(new PackageExampleGateway))->toThrow(RuntimeException::class);
});

test('provider settings encrypt credentials retain blank secrets and are permission protected', function () {
    $url=route('admin.billing.providers.update', 'example');
    $this->put($url, ['enabled'=>true, 'fields'=>['secret'=>'package-secret']])->assertSessionHasNoErrors();
    $this->put($url, ['enabled'=>true, 'fields'=>['secret'=>'']])->assertSessionHasNoErrors();
    expect($this->registry->configuration('example')['secret'])->toBe('package-secret');
    expect(\Illuminate\Support\Facades\DB::table('settings')->where('group', 'billing_provider')->where('name', 'provider_settings')->value('payload'))->not->toContain('package-secret');
    $this->get(route('admin.settings.billing.edit', ['section'=>'online']))->assertInertia(fn (Assert $page) =>$page->missing('settings.provider_settings')->where('providers.3.fields.secret.value', '')->where('providers.3.fields.secret.configured', true));
    $this->actingAs(User::factory()->create())->putJson($url, ['enabled'=>false, 'fields'=>['secret'=>'']])->assertForbidden();
});

test('checkouts retain their gateway when the default changes and disabled gateways still reconcile existing payments', function () {
    $settings=app(BillingProviderSettings::class);
    $settings->fill(['default_provider'=>'example', 'enabled_providers'=>['example', 'dodo'], 'invoice_checkout_enabled'=>true, 'document_policy_confirmed'=>true])->save();
    $invoice=app(SaveInvoiceDraft::class)->handle(['customer_id'=>Customer::factory()->create()->id, 'invoice_date'=>now()->subDay()->format('Y-m-d'), 'currency'=>'USD', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>(string) Str::uuid(), 'description'=>'Example', 'unit'=>'item', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]]]);
    $invoice->forceFill(['status'=>'issued', 'formatted_number'=>'INV-000001'])->save();
    $checkout=app(CreateInvoiceCheckout::class)->handle($invoice, (string) Str::uuid(), 'https://example.test/invoice');
    expect($checkout->provider)->toBe('example');
    $this->adapter->paymentData=['id'=>'example-payment', 'status'=>'succeeded', 'amount'=>10000, 'currency'=>'USD', 'metadata'=>['billing_checkout_id'=>$checkout->public_id]];
    $settings->fill(['default_provider'=>'dodo', 'enabled_providers'=>['dodo']])->save();
    expect(app(ReconcileProviderPayment::class)->handle('example-payment', 'example'))->toBe('processed');
    expect(app(ReconcileProviderPayment::class)->handle('example-payment', 'example'))->toBe('processed');
    expect(Payment::count())->toBe(1)->and(Payment::first()->provider)->toBe('example')->and(Payment::first()->method_label)->toBe('Example Payments');
});

test('unverified webhooks and unapproved checkout hosts are rejected', function () {
    $this->postJson(route('billing.webhooks.provider', 'example'), [])->assertUnauthorized();
    $this->withHeaders(['example-signature'=>'signed'])->postJson(route('billing.webhooks.provider', 'example'), [])->assertOk();
    $this->withHeaders(['example-signature'=>'signed'])->postJson(route('billing.webhooks.provider', 'example'), [])->assertOk();
    expect(ProviderEvent::where('provider', 'example')->count())->toBe(1);
    expect(fn () =>$this->registry->validateCheckoutUrl('example', 'https://attacker.test/pay'))->toThrow(RuntimeException::class);
    expect(fn () =>$this->registry->validateCheckoutUrl('example', 'http://checkout.example.test/pay'))->toThrow(RuntimeException::class);
});

test('provider namespace rollback succeeds before additional gateway history and protects it afterwards', function () {
    $migration = require base_path('modules/billing/database/migrations/2026_10_12_081000_add_discoverable_payment_providers.php');
    $migration->down();
    expect(\Illuminate\Support\Facades\Schema::hasColumn('billing_online_checkouts', 'provider'))->toBeFalse();
    $migration->up();
    ProviderEvent::create(['provider'=>'example', 'event_id'=>'example-history', 'event_type'=>'payment.pending', 'payload'=>[]]);
    expect(fn () => $migration->down())->toThrow(RuntimeException::class);
    expect(ProviderEvent::where('provider', 'example')->count())->toBe(1);
});
