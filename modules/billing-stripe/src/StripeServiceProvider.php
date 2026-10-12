<?php

namespace Modules\BillingStripe;

use Illuminate\Support\ServiceProvider;
use Modules\Billing\Services\PaymentGatewayRegistry;

class StripeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->afterResolving(PaymentGatewayRegistry::class, fn ($registry) => $registry->register(new StripeGateway));
    }
}
