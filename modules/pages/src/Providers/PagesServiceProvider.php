<?php

namespace Modules\Pages\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class PagesServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Register module services
    }

    public function boot(): void
    {
        $this->registerRoutes();
        $this->registerResources();
    }

    protected function registerRoutes(): void
    {
        Route::middleware(['web'])
            ->group(__DIR__ . '/../../routes/pages-routes.php');
    }

    protected function registerResources(): void
    {
        // Register views
        $this->loadViewsFrom(__DIR__ . '/../../resources/views', 'pages');

        // Register migrations
        $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');
    }
}
