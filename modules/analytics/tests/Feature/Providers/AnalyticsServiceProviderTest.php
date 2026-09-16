<?php

use Modules\Analytics\Providers\AnalyticsServiceProvider;

test('analytics service provider is registered', function () {
    expect(app()->getLoadedProviders())
        ->toHaveKey(AnalyticsServiceProvider::class)
        ->and(app()->getLoadedProviders()[AnalyticsServiceProvider::class])
        ->toBeTrue();
});
