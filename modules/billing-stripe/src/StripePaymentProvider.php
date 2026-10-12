<?php

namespace Modules\BillingStripe;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Modules\Billing\Contracts\PaymentProvider;
use Modules\Billing\Models\OnlineCheckout;
use Modules\Billing\Services\PaymentGatewayRegistry;

class StripePaymentProvider implements PaymentProvider
{
    private function client(): PendingRequest
    {
        $key = app(PaymentGatewayRegistry::class)->configuration('stripe')['secret_key'];
        if (! filled($key)) {
            throw new \RuntimeException('Configure the Stripe secret API key.');
        }

        return Http::withToken($key)->acceptJson()->timeout(20)->connectTimeout(5)->withoutRedirecting()->baseUrl('https://api.stripe.com/v1');
    }

    public function invoiceCheckout(OnlineCheckout $checkout): array
    {
        $session = $this->client()->asForm()->withHeaders(['Idempotency-Key'=>$checkout->request_key])->post('/checkout/sessions', [
            'mode'               => 'payment', 'client_reference_id'=>$checkout->public_id,
            'success_url'        => route('billing.payment-return', $checkout->public_id), 'cancel_url'=>$checkout->invoice_url,
            'metadata'           => ['billing_checkout_id'=>$checkout->public_id],
            'payment_intent_data'=> ['metadata'=>['billing_checkout_id'=>$checkout->public_id]],
            'line_items'         => [['quantity'=>1, 'price_data'=>['currency'=>strtolower($checkout->currency), 'unit_amount'=>$checkout->expected_minor, 'product_data'=>['name'=>'Invoice '.$checkout->invoice->formatted_number]]]],
        ])->throw()->json();

        return ['session_id'=>$session['id'], 'url'=>$session['url']];
    }

    public function payment(string $id): array
    {
        if (! preg_match('/^pi_[a-zA-Z0-9]+$/D', $id)) {
            throw new \RuntimeException('Invalid Stripe payment identity.');
        }
        $payment = $this->client()->get('/payment_intents/'.$id, ['expand'=>['latest_charge']])->throw()->json();
        $charge  = $payment['latest_charge'] ?? null;
        // Refund evidence must come from a retrieved charge, not an unexpanded ID.
        if (is_string($charge)) {
            $charge = $this->client()->get('/charges/'.rawurlencode($charge))->throw()->json();
        }

        return ['id'  => $payment['id'], 'status'=>$payment['status'], 'amount'=>$payment['amount_received'] ?? 0,
            'currency'=> strtoupper($payment['currency']), 'metadata'=>$payment['metadata'] ?? [],
            'refunded'=> is_array($charge) && (($charge['amount_refunded'] ?? 0) > 0 || ($charge['refunded'] ?? false))];
    }

    public function checkoutPaymentId(string $sessionId): ?string
    {
        if (! preg_match('/^cs_[a-zA-Z0-9_]+$/D', $sessionId)) {
            throw new \RuntimeException('Invalid Stripe session identity.');
        }
        $session = $this->client()->get('/checkout/sessions/'.$sessionId)->throw()->json();
        $id      = $session['payment_intent'] ?? null;

        return ($session['payment_status'] ?? '') === 'paid' && is_string($id) ? $id : null;
    }
}
