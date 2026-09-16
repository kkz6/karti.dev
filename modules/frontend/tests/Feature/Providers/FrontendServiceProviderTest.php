<?php

test('frontend service provider is registered', function () {
    expect(app()->getProvider(\Modules\Frontend\Providers\FrontendServiceProvider::class))
        ->toBeInstanceOf(\Modules\Frontend\Providers\FrontendServiceProvider::class);
});
