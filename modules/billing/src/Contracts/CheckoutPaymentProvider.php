<?php

namespace Modules\Billing\Contracts;

use Modules\Billing\Models\OnlineCheckout;

/** Providers which require the original session to verify payment-to-invoice ownership. */
interface CheckoutPaymentProvider extends PaymentProvider
{
    public function paymentForCheckout(string $id, OnlineCheckout $checkout): array;
}
