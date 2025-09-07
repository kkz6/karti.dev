<?php

namespace Modules\Speaking\Providers;

use Illuminate\Support\ServiceProvider;

class SpeakingServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap the application services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');
        $this->loadRoutesFrom(__DIR__ . '/../../routes/speaking-routes.php');
    }
}
