<?php

namespace Modules\Frontend\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Modules\Frontend\Console\Commands\ExpireStaleBookingsCommand;

class FrontendServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        RateLimiter::for('newsletter', function (Request $request) {
            $email   = $request->input('email');
            $email   = is_string($email) ? strtolower(trim($email)) : '';
            $limited = fn () => redirect()->back(303)->withErrors(['email' => 'Too many subscription attempts. Please try again in an hour.']);

            return [
                Limit::perHour(10)->by('newsletter-ip:'.hash('sha256', $request->ip() ?? 'unknown'))->response($limited),
                Limit::perHour(3)->by('newsletter-email:'.hash_hmac('sha256', $email, config('app.key')))->response($limited),
            ];
        });

        RateLimiter::for('contact', function (Request $request) {
            $email   = is_string($request->input('email')) ? strtolower(trim($request->input('email'))) : '';
            $limited = fn () => redirect()->back(303)->withErrors([
                'message' => 'Too many messages were sent recently. Please wait before trying again.',
            ]);

            return [
                Limit::perHour(8)->by('contact-ip:'.hash_hmac('sha256', (string) ($request->ip() ?? 'unknown'), (string) config('app.key')))->response($limited),
                Limit::perHour(3)->by('contact-email:'.hash_hmac('sha256', $email, (string) config('app.key')))->response($limited),
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
