<?php

namespace Modules\BillingRazorpay;

use Illuminate\Http\Request;
use Modules\Billing\Contracts\PaymentGateway;
use Modules\Billing\Services\PaymentGatewayRegistry;

class RazorpayGateway implements PaymentGateway
{
    public function id(): string
    {
        return 'razorpay';
    }

    public function name(): string
    {
        return 'Razorpay';
    }

    public function providerClass(): string
    {
        return RazorpayPaymentProvider::class;
    }

    public function checkoutHosts(): array
    {
        return ['rzp.io', '*.razorpay.com'];
    }

    public function fields(): array
    {
        return [
            'key_id'        => ['label'=>'API key ID (use rzp_test_ for testing)', 'type'=>'text', 'required'=>true, 'default'=>''],
            'key_secret'    => ['label'=>'API key secret', 'type'=>'password', 'required'=>true, 'default'=>''],
            'webhook_secret'=> ['label'=>'Webhook signing secret', 'type'=>'password', 'required'=>true, 'default'=>''],
        ];
    }

    public function verifyWebhook(Request $request): array
    {
        $secret = app(PaymentGatewayRegistry::class)->configuration('razorpay')['webhook_secret'];
        abort_unless(filled($secret), 503, 'Webhook verification is not configured.');
        abort_unless(hash_equals(hash_hmac('sha256', $request->getContent(), $secret), $request->header('X-Razorpay-Signature', '')), 401, 'Invalid webhook signature.');
        try {
            $event = json_decode($request->getContent(), true, 64, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            abort(400, 'Invalid webhook payload.');
        }
        $type = $event['event'] ?? '';
        $link = $event['payload']['payment_link']['entity'] ?? [];

        return ['event_id'=> $request->header('X-Razorpay-Event-Id') ?: hash('sha256', $request->getContent()),
            'event_type'  => $type === 'payment_link.paid' ? 'payment.succeeded' : (str_starts_with($type, 'refund.') ? $type : 'ignored.'.$type),
            'payload'     => ['data'=>['payment_id'=>$event['payload']['payment']['entity']['id'] ?? null, 'checkout_id'=>$link['reference_id'] ?? null]]];
    }
}
