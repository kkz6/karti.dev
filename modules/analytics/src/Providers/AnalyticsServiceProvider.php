<?php

namespace Modules\Analytics\Providers;

use Illuminate\Support\ServiceProvider;

class AnalyticsServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        $this->commands([\Modules\Analytics\Console\PruneTraffic::class]);
        $this->callAfterResolving(\Illuminate\Console\Scheduling\Schedule::class, function ($schedule) {
            $schedule->command('traffic:prune')->daily()->withoutOverlapping();
        });
    }
}
