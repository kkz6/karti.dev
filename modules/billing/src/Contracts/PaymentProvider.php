<?php

namespace Modules\Billing\Contracts;

interface PaymentProvider
{
    public function payment(string $id): array;

    public function invoiceCheckout(\Modules\Billing\Models\OnlineCheckout $checkout): array;

    public function checkoutPaymentId(string $sessionId): ?string;
}
