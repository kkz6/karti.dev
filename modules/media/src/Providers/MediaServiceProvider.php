<?php

namespace Modules\Media\Providers;

use Illuminate\Support\ServiceProvider;

class MediaServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(
            dirname(__DIR__).'/../config/mediable.php',
            'mediable'
        );
    }

    public function boot(): void {}
}
