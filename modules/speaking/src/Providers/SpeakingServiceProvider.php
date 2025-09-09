<?php

namespace Modules\Speaking\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Speaking\Interfaces\SpeakingEventRepositoryInterface;
use Modules\Speaking\Interfaces\SpeakingEventServiceInterface;
use Modules\Speaking\Repositories\SpeakingEventRepository;
use Modules\Speaking\Services\SpeakingEventService;

class SpeakingServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->bindRepositories();
        $this->bindServices();
    }

    /**
     * Bootstrap the application services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');
        $this->loadRoutesFrom(__DIR__ . '/../../routes/speaking-routes.php');
    }

    /**
     * Bind repository interfaces to implementations.
     */
    private function bindRepositories(): void
    {
        $this->app->bind(
            SpeakingEventRepositoryInterface::class,
            SpeakingEventRepository::class
        );
    }

    /**
     * Bind service interfaces to implementations.
     */
    private function bindServices(): void
    {
        $this->app->bind(
            SpeakingEventServiceInterface::class,
            SpeakingEventService::class
        );
    }
}
