<?php

namespace Modules\BillingDodo;

use Illuminate\Support\ServiceProvider;
use Modules\Billing\Services\PaymentGatewayRegistry;

class DodoServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->afterResolving(PaymentGatewayRegistry::class, fn ($registry) => $registry->register(new DodoGateway));
    }
}
