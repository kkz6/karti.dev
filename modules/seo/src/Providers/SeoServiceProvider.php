<?php

namespace Modules\Seo\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Seo\SEOManager;

class SeoServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__ . '/../../config/seo.php', 'seo');

        $this->app->singleton('seo-manager', function () {
            return new SEOManager();
        });
    }

    public function boot(): void
    {
        $this->publishes([
            __DIR__ . '/../../config/seo.php' => config_path('seo.php'),
        ], 'seo-config');

        // Load helper functions
        require_once __DIR__ . '/../helpers.php';
    }
}
