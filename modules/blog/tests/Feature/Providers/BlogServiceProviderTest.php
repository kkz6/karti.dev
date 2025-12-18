<?php

test('blog service provider is registered', function () {
    expect(app()->bound('Modules\Blog\Providers\BlogServiceProvider'))->toBeTrue();
});
