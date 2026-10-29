<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Modules\Settings\Http\Middleware\ApplyEmailSettings;
use Modules\Settings\Http\Middleware\ApplySiteSettings;
use Modules\Settings\Settings\EmailSettings;
use Modules\Settings\Settings\SiteSettings;
use Modules\Settings\Support\EmailConfiguration;

uses(RefreshDatabase::class);

test('site and email middleware check the settings table once per request', function () {
    Schema::shouldReceive('hasTable')->with('settings')->once()->andReturn(true);
    $request  = Request::create('/settings-check');
    $response = app(ApplySiteSettings::class)->handle($request, fn ($request) => app(ApplyEmailSettings::class)->handle($request, fn () => response('ok')));
    expect($response->getContent())->toBe('ok')->and($request->attributes->get('settings.table_exists'))->toBeTrue();
});

test('middleware uses defaults before migrations without resolving stored settings', function () {
    Schema::shouldReceive('hasTable')->with('settings')->once()->andReturn(false);
    foreach ([SiteSettings::class, EmailSettings::class] as $settings) {
        app()->bind($settings, fn () => throw new RuntimeException('Stored settings must not be resolved before migrations.'));
    }
    $original = config('app.name');
    $request  = Request::create('/settings-check');
    $response = app(ApplySiteSettings::class)->handle($request, fn ($request) => app(ApplyEmailSettings::class)->handle($request, fn () => response(config('app.name'))));
    expect($response->getContent())->toBe(SiteSettings::defaults()['name'])->and(config('app.name'))->toBe($original);
});

test('standalone email configuration still checks the table without request middleware', function () {
    Schema::shouldReceive('hasTable')->with('settings')->once()->andReturn(false);
    app()->bind(EmailSettings::class, fn () => throw new RuntimeException('Missing email settings must not be resolved.'));
    expect(app(EmailConfiguration::class)->run(fn () => 'ok'))->toBe('ok');
});
