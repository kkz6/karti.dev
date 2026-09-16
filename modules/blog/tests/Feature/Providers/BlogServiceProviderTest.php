<?php

test('blog service provider is registered', function () {
    expect(app()->getProvider(\Modules\Blog\Providers\BlogServiceProvider::class))
        ->toBeInstanceOf(\Modules\Blog\Providers\BlogServiceProvider::class);
});
