<?php

test('frontend service provider is registered', function () {
    expect(app()->bound('Modules\Frontend\Providers\FrontendServiceProvider'))->toBeTrue();
});
