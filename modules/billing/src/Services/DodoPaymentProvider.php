<?php

namespace Modules\Billing\Services;

use Dodopayments\Client;
use Dodopayments\Products\Price\OneTimePrice;
use Modules\Billing\Contracts\PaymentProvider;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\OnlineCheckout;
use Modules\Billing\Settings\BillingProviderSettings;

class DodoPaymentProvider implements PaymentProvider
{
    public function client(): Client
    {
        $configuration = app(PaymentGatewayRegistry::class)->configuration('dodo');

        return new Client(bearerToken: $configuration['api_key'], baseUrl: $configuration['test_mode'] ? 'https://test.dodopayments.com' : 'https://live.dodopayments.com');
    }

    public function payment(string $id): array
    {
        $p=$this->client()->payments->retrieve($id, requestOptions: ['timeout'=>15, 'maxRetries'=>0]);

        return ['id'=>$p->paymentID, 'status'=>$p->status, 'amount'=>$p->totalAmount, 'currency'=>$p->currency, 'metadata'=>$p->metadata, 'refunded'=>($p->refundStatus ?? null) !== null];
    }

    public function checkoutPaymentId(string $sessionId): ?string
    {
        return $this->client()->checkoutSessions->retrieve($sessionId, requestOptions: ['timeout'=>15, 'maxRetries'=>0])->paymentID;
    }

    public function invoiceCheckout(OnlineCheckout $checkout): array
    {
        $settings =app(BillingProviderSettings::class);
        $productId=app(PaymentGatewayRegistry::class)->configuration('dodo')['invoice_product_id'];
        $client   =$this->client();
        $product  =$client->products->retrieve($productId, requestOptions: ['timeout'=>15, 'maxRetries'=>0]);
        $price    =$product->price;
        if (! $price instanceof OneTimePrice || ! $price->payWhatYouWant || ! $price->taxInclusive || $price->currency !== $checkout->currency || $price->discount !== 0 || $price->purchasingPowerParity || $price->price > $checkout->expected_minor) {
            throw new \RuntimeException('The invoice product must support exact, tax-inclusive pay-what-you-want pricing in this currency.');
        }
        $invoice=Invoice::findOrFail($checkout->invoice_id);
        $result =$client->checkoutSessions->create(productCart: [['product_id'=>$productId, 'quantity'=>1, 'amount'=>$checkout->expected_minor]], billingCurrency: $checkout->currency,
            billingAddress: ['country'=>$invoice->customer_snapshot['billing_country']], metadata: ['billing_checkout_id'=>$checkout->public_id], returnURL: route('billing.payment-return', $checkout->public_id),
            requestOptions: ['timeout'=>20, 'maxRetries'=>0, 'extraHeaders'=>['Idempotency-Key'=>$checkout->request_key]]);
        $url =$result->checkoutURL;
        $host=strtolower(parse_url($url ?? '', PHP_URL_HOST) ?? '');
        if (parse_url($url ?? '', PHP_URL_SCHEME) !== 'https' || ! str_ends_with($host, '.dodopayments.com')) {
            throw new \RuntimeException('Invalid checkout destination.');
        }

        return ['session_id'=>$result->sessionID, 'url'=>$url];
    }
}
