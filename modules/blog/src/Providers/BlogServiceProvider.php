<?php

namespace Modules\Blog\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class BlogServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->registerRoutes();
        $this->registerResources();
    }

    protected function registerRoutes(): void
    {
        Route::middleware(['web'])
            ->group(__DIR__ . '/../../routes/blog-routes.php');
    }

    protected function registerResources(): void
    {
        $this->loadViewsFrom(__DIR__ . '/../../resources/views', 'blog');
        $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');
    }
}
