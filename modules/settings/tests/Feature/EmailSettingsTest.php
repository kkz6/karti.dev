<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Settings\Settings\EmailSettings;
use Modules\Settings\Support\EmailConfiguration;

uses(RefreshDatabase::class);

function emailSettingsPayload(array $overrides = []): array
{
    return array_replace([
        'enabled'        => true,
        'host'           => 'smtp.example.com',
        'port'           => 587,
        'username'       => 'mailer@example.com',
        'password'       => 'smtp-secret',
        'clear_password' => false,
        'encryption'     => 'tls',
        'from_address'   => 'hello@example.com',
        'from_name'      => 'Field Notes',
    ], $overrides);
}

test('email settings require authentication', function () {
    $this->get(route('admin.settings.email.edit'))->assertRedirect(route('login'));
    $this->putJson(route('admin.settings.email.update'), emailSettingsPayload())->assertUnauthorized();
});

test('email settings never expose the saved password', function () {
    $settings = app(EmailSettings::class);
    $settings->fill(['password' => 'existing-secret'])->save();

    $this->actingAs(User::factory()->create())->get(route('admin.settings.email.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/email')
            ->has('emailSettings.host')
            ->missing('emailSettings.password')
            ->where('passwordConfigured', true)
        );
});

test('email credentials are encrypted and an empty password keeps the saved secret', function () {
    $this->actingAs(User::factory()->create())
        ->put(route('admin.settings.email.update'), emailSettingsPayload())
        ->assertRedirect(route('admin.settings.email.edit'))
        ->assertSessionHas('settings_saved', true);

    $stored = (string) DB::table('settings')->where('group', 'email')->where('name', 'password')->value('payload');
    expect($stored)->not->toContain('smtp-secret');

    app()->forgetInstance(EmailSettings::class);
    expect(app(EmailSettings::class)->password)->toBe('smtp-secret');

    $this->put(route('admin.settings.email.update'), emailSettingsPayload(['password' => '', 'from_name' => 'Updated sender']))
        ->assertSessionHasNoErrors();
    app()->forgetInstance(EmailSettings::class);
    expect(app(EmailSettings::class)->password)->toBe('smtp-secret')
        ->and(app(EmailSettings::class)->from_name)->toBe('Updated sender');
});

test('a saved password can be removed when authentication is no longer used', function () {
    app(EmailSettings::class)->fill(['password' => 'existing-secret'])->save();

    $this->actingAs(User::factory()->create())
        ->put(route('admin.settings.email.update'), emailSettingsPayload([
            'enabled'        => false,
            'username'       => '',
            'password'       => '',
            'clear_password' => true,
        ]))->assertSessionHasNoErrors();

    app()->forgetInstance(EmailSettings::class);
    expect(app(EmailSettings::class)->password)->toBe('');
});

test('enabled SMTP settings validate connection sender and authentication fields', function (array $changes, string $field) {
    $this->actingAs(User::factory()->create())
        ->putJson(route('admin.settings.email.update'), emailSettingsPayload($changes))
        ->assertUnprocessable()
        ->assertJsonValidationErrors($field);
})->with([
    [['host' => ''], 'host'],
    [['host' => 'https://smtp.example.com'], 'host'],
    [['port' => 70000], 'port'],
    [['encryption' => 'none'], 'encryption'],
    [['from_address' => 'invalid'], 'from_address'],
    [['from_name' => ''], 'from_name'],
    [['password' => ''], 'password'],
]);

test('custom email settings apply only for the duration of the operation', function () {
    $settings = app(EmailSettings::class);
    $settings->fill([
        'enabled'      => true,
        'host'         => 'smtp.example.com',
        'port'         => 465,
        'username'     => 'mailer@example.com',
        'password'     => 'smtp-secret',
        'encryption'   => 'ssl',
        'from_address' => 'hello@example.com',
        'from_name'    => 'Field Notes',
    ])->save();

    $before = config('mail');
    app(EmailConfiguration::class)->run(function (): void {
        expect(config('mail.default'))->toBe('smtp')
            ->and(config('mail.mailers.smtp.scheme'))->toBe('smtps')
            ->and(config('mail.mailers.smtp.host'))->toBe('smtp.example.com')
            ->and(config('mail.mailers.smtp.password'))->toBe('smtp-secret')
            ->and(config('mail.from.address'))->toBe('hello@example.com');
    });

    expect(config('mail'))->toBe($before);
});
