<?php

namespace Modules\BillingStripe;

use Illuminate\Http\Request;
use Modules\Billing\Contracts\PaymentGateway;
use Modules\Billing\Services\PaymentGatewayRegistry;

class StripeGateway implements PaymentGateway
{
    public function id(): string
    {
        return 'stripe';
    }

    public function name(): string
    {
        return 'Stripe';
    }

    public function providerClass(): string
    {
        return StripePaymentProvider::class;
    }

    public function checkoutHosts(): array
    {
        return ['checkout.stripe.com'];
    }

    public function fields(): array
    {
        return [
            'secret_key'     => ['label'=>'Secret API key (use sk_test_ for testing)', 'type'=>'password', 'required'=>true, 'default'=>''],
            'webhook_secret' => ['label'=>'Webhook signing secret', 'type'=>'password', 'required'=>true, 'default'=>''],
        ];
    }

    public function verifyWebhook(Request $request): array
    {
        $secret = app(PaymentGatewayRegistry::class)->configuration('stripe')['webhook_secret'];
        abort_unless(filled($secret), 503, 'Webhook verification is not configured.');
        $parts = [];
        foreach (explode(',', $request->header('Stripe-Signature', '')) as $part) {
            [$key, $value] = array_pad(explode('=', trim($part), 2), 2, '');
            $parts[$key][] = $value;
        }
        $timestamp = $parts['t'][0] ?? '';
        abort_unless(ctype_digit($timestamp) && abs(now()->timestamp - (int) $timestamp) <= 300, 401, 'Invalid webhook timestamp.');
        $expected = hash_hmac('sha256', $timestamp.'.'.$request->getContent(), $secret);
        $valid    = false;
        foreach ($parts['v1'] ?? [] as $signature) {
            $valid = hash_equals($expected, $signature) || $valid;
        }
        abort_unless($valid, 401, 'Invalid webhook signature.');
        try {
            $event = json_decode($request->getContent(), true, 64, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            abort(400, 'Invalid webhook payload.');
        }
        $type = $event['type'] ?? '';

        return ['event_id'=> $event['id'] ?? null, 'event_type'=>$type === 'payment_intent.succeeded' ? 'payment.succeeded' : ($type === 'charge.refunded' ? 'refund.succeeded' : 'ignored.'.$type),
            'payload'     => ['data'=>['payment_id'=>$event['data']['object']['id'] ?? null]]];
    }
}
