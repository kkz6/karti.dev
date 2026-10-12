<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Frontend\Services\Turnstile;
use Modules\Settings\Settings\SpamProtectionSettings;

uses(RefreshDatabase::class);

test('spam protection settings require authentication', function () {
    $this->get(route('admin.settings.protection.edit'))->assertRedirect(route('login'));
    $this->putJson(route('admin.settings.protection.update'), ['enabled' => false, 'site_key' => '', 'secret_key' => '', 'clear_secret_key' => false])->assertUnauthorized();
});

test('Turnstile settings encrypt credentials and keep blank secrets without falling back to env', function () {
    $this->actingAs(User::factory()->create());
    $payload = ['enabled' => true, 'site_key' => 'saved-site-key', 'secret_key' => 'saved-secret-key', 'clear_secret_key' => false];
    $this->put(route('admin.settings.protection.update'), $payload)->assertSessionHasNoErrors()->assertRedirect(route('admin.settings.protection.edit'));
    expect(DB::table('settings')->where('group', 'spam_protection')->where('name', 'secret_key')->value('payload'))->not->toContain('saved-secret-key');
    app()->forgetInstance(SpamProtectionSettings::class);
    expect(app(SpamProtectionSettings::class)->secret_key)->toBe('saved-secret-key');
    $this->get(route('admin.settings.protection.edit'))->assertInertia(fn (Assert $page) => $page->component('settings/protection')->missing('settings.secret_key')->where('secretConfigured', true)->where('status', 'active'));
    $this->put(route('admin.settings.protection.update'), [...$payload, 'secret_key' => ''])->assertSessionHasNoErrors();
    expect(app(SpamProtectionSettings::class)->secret_key)->toBe('saved-secret-key');
    config(['contact.turnstile.enabled' => true, 'contact.turnstile.site_key' => 'env-site-key', 'contact.turnstile.secret_key' => 'env-secret-key']);
    Http::fake(['challenges.cloudflare.com/*' => Http::response(['success' => true, 'action' => 'contact'])]);
    expect(app(Turnstile::class)->siteKey())->toBe('saved-site-key')->and(app(Turnstile::class)->verify('token'))->toBeTrue();
    Http::assertSent(fn ($request) => $request['secret'] === 'saved-secret-key');
    $this->put(route('admin.settings.protection.update'), [...$payload, 'enabled' => false, 'secret_key' => '', 'clear_secret_key' => true])->assertSessionHasNoErrors();
    expect(app(SpamProtectionSettings::class)->secret_key)->toBe('')->and(app(Turnstile::class)->enabled())->toBeFalse();
    $this->get(route('admin.settings.protection.edit'))->assertInertia(fn (Assert $page) => $page->where('status', 'disabled')->where('secretConfigured', false));
});

test('incomplete Turnstile configurations cannot be enabled or lose a required secret', function () {
    $this->actingAs(User::factory()->create());
    $payload = ['enabled' => true, 'site_key' => '', 'secret_key' => '', 'clear_secret_key' => false];
    $this->putJson(route('admin.settings.protection.update'), $payload)->assertUnprocessable()->assertJsonValidationErrors('site_key');
    $this->putJson(route('admin.settings.protection.update'), [...$payload, 'site_key' => 'site-key'])->assertUnprocessable()->assertJsonValidationErrors('secret_key');
    app(SpamProtectionSettings::class)->fill(['enabled' => true, 'site_key' => 'site-key', 'secret_key' => 'existing-secret'])->save();
    $this->putJson(route('admin.settings.protection.update'), [...$payload, 'site_key' => 'site-key', 'clear_secret_key' => true])->assertUnprocessable()->assertJsonValidationErrors('secret_key');
    expect(app(SpamProtectionSettings::class)->secret_key)->toBe('existing-secret');
});
