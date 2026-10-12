<?php

namespace Modules\BillingRazorpay;

use Illuminate\Support\ServiceProvider;
use Modules\Billing\Services\PaymentGatewayRegistry;

class RazorpayServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->afterResolving(PaymentGatewayRegistry::class, fn ($registry) => $registry->register(new RazorpayGateway));
    }
}
