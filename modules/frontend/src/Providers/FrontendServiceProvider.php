<?php

namespace Modules\Frontend\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\ServiceProvider;
use Modules\Frontend\Console\Commands\ExpireStaleBookingsCommand;

class FrontendServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        $this->commands([ExpireStaleBookingsCommand::class]);

        $this->callAfterResolving(Schedule::class, function (Schedule $schedule) {
            $schedule->command('bookings:expire-stale')->everyFiveMinutes();
        });
        $this->loadRoutesFrom(__DIR__.'/../../routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'frontend');

        // Register Inertia pages namespace
        if (class_exists(\Inertia\Inertia::class)) {
            \Inertia\Inertia::setRootView('app');

            // Register the module's pages
            app('inertia.testing.view-finder')->addNamespace('frontend', __DIR__.'/../../resources/js/pages');
        }
    }
}
