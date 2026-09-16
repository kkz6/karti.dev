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
        \Illuminate\Support\Facades\RateLimiter::for('newsletter', function (\Illuminate\Http\Request $request) {
            $email = $request->input('email');
            $email = is_string($email) ? strtolower(trim($email)) : '';
            $limited = fn () => redirect()->back(303)->withErrors(['email' => 'Too many subscription attempts. Please try again in an hour.']);
            return [
                \Illuminate\Cache\RateLimiting\Limit::perHour(10)->by('newsletter-ip:'.hash('sha256', $request->ip() ?? 'unknown'))->response($limited),
                \Illuminate\Cache\RateLimiting\Limit::perHour(3)->by('newsletter-email:'.hash_hmac('sha256', $email, config('app.key')))->response($limited),
            ];
        });
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
