<?php

namespace Modules\BillingDodo;

use Illuminate\Http\Request;
use Modules\Billing\Contracts\PaymentGateway;
use Modules\Billing\Services\DodoPaymentProvider;
use Modules\Billing\Services\PaymentGatewayRegistry;
use Modules\Billing\Settings\BillingProviderSettings;

class DodoGateway implements PaymentGateway
{
    public function id(): string
    {
        return 'dodo';
    }

    public function name(): string
    {
        return 'Dodo Payments';
    }

    public function providerClass(): string
    {
        return DodoPaymentProvider::class;
    }

    public function checkoutHosts(): array
    {
        return ['*.dodopayments.com'];
    }

    public function fields(): array
    {
        return [
            'api_key'            => ['label' => 'API key', 'type' => 'password', 'required' => true, 'default' => config('services.dodo_payments.api_key')],
            'webhook_key'        => ['label' => 'Webhook signing key', 'type' => 'password', 'required' => true, 'default' => config('services.dodo_payments.webhook_key')],
            'test_mode'          => ['label' => 'Test mode', 'type' => 'checkbox', 'default' => (bool) config('services.dodo_payments.test_mode')],
            'invoice_product_id' => ['label' => 'Exact-price invoice product ID', 'type' => 'text', 'required' => true, 'default' => app(BillingProviderSettings::class)->invoice_product_id],
        ];
    }

    public function verifyWebhook(Request $request): array
    {
        $secret = app(PaymentGatewayRegistry::class)->configuration('dodo')['webhook_key'];
        abort_unless(is_string($secret) && $secret !== '', 503, 'Webhook verification is not configured.');
        try {
            (new \StandardWebhooks\Webhook($secret))->verify($request->getContent(), ['webhook-id' => $request->header('webhook-id', ''), 'webhook-timestamp' => $request->header('webhook-timestamp', ''), 'webhook-signature' => $request->header('webhook-signature', '')]);
            $payload = json_decode($request->getContent(), true, 64, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            abort(401, 'Invalid webhook signature or payload.');
        }

        return ['event_id' => $request->header('webhook-id'), 'event_type' => $payload['type'] ?? null, 'payload' => $payload];
    }
}
