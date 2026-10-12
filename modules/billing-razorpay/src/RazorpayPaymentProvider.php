<?php

namespace Modules\BillingRazorpay;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Modules\Billing\Contracts\CheckoutPaymentProvider;
use Modules\Billing\Models\OnlineCheckout;
use Modules\Billing\Services\PaymentGatewayRegistry;

class RazorpayPaymentProvider implements CheckoutPaymentProvider
{
    private function client(): PendingRequest
    {
        $config = app(PaymentGatewayRegistry::class)->configuration('razorpay');
        if (! filled($config['key_id']) || ! filled($config['key_secret'])) {
            throw new \RuntimeException('Configure Razorpay API credentials.');
        }

        return Http::withBasicAuth($config['key_id'], $config['key_secret'])->acceptJson()->timeout(20)->connectTimeout(5)->withoutRedirecting()->baseUrl('https://api.razorpay.com/v1');
    }

    private function existing(OnlineCheckout $checkout): ?array
    {
        $data = $this->client()->get('/payment_links', ['reference_id'=>$checkout->public_id])->throw()->json();
        foreach ($data['payment_links'] ?? [] as $link) {
            if (($link['reference_id'] ?? '') === $checkout->public_id) {
                return $link;
            }
        }

        return null;
    }

    public function invoiceCheckout(OnlineCheckout $checkout): array
    {
        // A stable, provider-enforced unique reference recovers a link after a lost response.
        $link = $this->existing($checkout);
        if (! $link) {
            try {
                $link = $this->client()->post('/payment_links', [
                    'amount'      => $checkout->expected_minor, 'currency'=>$checkout->currency, 'accept_partial'=>false,
                    'reference_id'=> $checkout->public_id, 'description'=>'Invoice '.$checkout->invoice->formatted_number,
                    'notes'       => ['billing_checkout_id'=>$checkout->public_id], 'notify'=>['email'=>false, 'sms'=>false], 'reminder_enable'=>false,
                    'callback_url'=> route('billing.payment-return', $checkout->public_id), 'callback_method'=>'get',
                ])->throw()->json();
            } catch (\Throwable $error) {
                $link = $this->existing($checkout);
                if (! $link) {
                    throw $error;
                }
            }
        }
        if (($link['accept_partial'] ?? false) !== false || ($link['amount'] ?? null) !== $checkout->expected_minor || ($link['currency'] ?? '') !== $checkout->currency || ! in_array($link['status'] ?? '', ['created', 'paid'], true)) {
            throw new \RuntimeException('Razorpay link no longer matches the checkout.');
        }

        return ['session_id'=>$link['id'], 'url'=>$link['short_url']];
    }

    private function link(string $id): array
    {
        if (! preg_match('/^plink_[a-zA-Z0-9]+$/D', $id)) {
            throw new \RuntimeException('Invalid Razorpay link identity.');
        }

        return $this->client()->get('/payment_links/'.$id)->throw()->json();
    }

    public function checkoutPaymentId(string $sessionId): ?string
    {
        $link = $this->link($sessionId);
        if (($link['status'] ?? '') !== 'paid') {
            return null;
        }
        foreach ($link['payments'] ?? [] as $payment) {
            if (($payment['status'] ?? '') === 'captured') {
                return $payment['payment_id'] ?? null;
            }
        }

        return null;
    }

    public function payment(string $id): array
    {
        if (! preg_match('/^pay_[a-zA-Z0-9]+$/D', $id)) {
            throw new \RuntimeException('Invalid Razorpay payment identity.');
        }
        $payment = $this->client()->get('/payments/'.$id)->throw()->json();

        return ['id'  => $payment['id'], 'status'=>($payment['status'] ?? '') === 'captured' ? 'succeeded' : 'pending',
            'amount'  => $payment['amount'], 'currency'=>strtoupper($payment['currency']), 'metadata'=>[],
            'refunded'=> ($payment['amount_refunded'] ?? 0) > 0 || filled($payment['refund_status'] ?? null)];
    }

    public function paymentForCheckout(string $id, OnlineCheckout $checkout): array
    {
        $payment = $this->payment($id);
        $link    = $this->link($checkout->session_id);
        $matches = collect($link['payments'] ?? [])->contains(fn ($row) => ($row['payment_id'] ?? '') === $id && ($row['status'] ?? '') === 'captured');
        if (! $matches || ($link['reference_id'] ?? '') !== $checkout->public_id || ($link['amount'] ?? null) !== $checkout->expected_minor || ($link['currency'] ?? '') !== $checkout->currency) {
            throw new \RuntimeException('Razorpay payment does not belong to this checkout.');
        }
        $payment['metadata'] = ['billing_checkout_id'=>$checkout->public_id];

        return $payment;
    }
}
