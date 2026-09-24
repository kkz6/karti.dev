<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Settings\Mail\EmailDeliveryTest;
use Modules\Settings\Settings\EmailSettings;
use Modules\Settings\Support\EmailConfiguration;

uses(RefreshDatabase::class);

function emailSettingsPayload(array $overrides = []): array
{
    return array_replace([
        'enabled'              => true,
        'provider'             => 'smtp',
        'host'                 => 'smtp.example.com',
        'port'                 => 587,
        'username'             => 'mailer@example.com',
        'password'             => 'smtp-secret',
        'clear_password'       => false,
        'resend_api_key'       => '',
        'clear_resend_api_key' => false,
        'encryption'           => 'tls',
        'from_address'         => 'hello@example.com',
        'from_name'            => 'Field Notes',
    ], $overrides);
}

test('email settings require authentication', function () {
    $this->get(route('admin.settings.email.edit'))->assertRedirect(route('login'));
    $this->putJson(route('admin.settings.email.update'), emailSettingsPayload())->assertUnauthorized();
    $this->postJson(route('admin.settings.email.test'), ['recipient' => 'test@example.com'])->assertUnauthorized();
});

test('email settings never expose saved credentials', function () {
    $settings = app(EmailSettings::class);
    $settings->fill(['password' => 'existing-secret', 'resend_api_key' => 're_existing'])->save();

    $this->actingAs(User::factory()->create())->get(route('admin.settings.email.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/email')
            ->has('emailSettings.host')
            ->missing('emailSettings.password')
            ->missing('emailSettings.resend_api_key')
            ->where('passwordConfigured', true)
            ->where('apiKeyConfigured', true)
            ->where('testRecipient', fn (string $recipient) => $recipient !== '')
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

test('resend api keys are encrypted and write only', function () {
    $this->actingAs(User::factory()->create())
        ->put(route('admin.settings.email.update'), emailSettingsPayload([
            'provider'       => 'resend',
            'host'           => '',
            'port'           => null,
            'username'       => '',
            'password'       => '',
            'resend_api_key' => 're_secret-key',
        ]))->assertSessionHasNoErrors();

    $stored         = (string) DB::table('settings')->where('group', 'email')->where('name', 'resend_api_key')->value('payload');
    $storedProvider = (string) DB::table('settings')->where('group', 'email')->where('name', 'provider')->value('payload');
    expect($stored)->not->toContain('re_secret-key')
        ->and($storedProvider)->toBe(json_encode('resend'));

    app()->forgetInstance(EmailSettings::class);
    expect(app(EmailSettings::class)->provider)->toBe('resend')
        ->and(app(EmailSettings::class)->resend_api_key)->toBe('re_secret-key');
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
    [['provider' => 'invalid'], 'provider'],
]);

test('enabled resend settings require an api key but not smtp connection fields', function () {
    $payload = emailSettingsPayload([
        'provider'       => 'resend',
        'host'           => '',
        'port'           => null,
        'username'       => '',
        'password'       => '',
        'resend_api_key' => '',
    ]);

    $this->actingAs(User::factory()->create())
        ->putJson(route('admin.settings.email.update'), $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors('resend_api_key')
        ->assertJsonMissingValidationErrors(['host', 'port', 'password']);
});

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

test('resend settings configure the native resend mailer for the duration of the operation', function () {
    $settings = app(EmailSettings::class);
    $settings->fill([
        'enabled'        => true,
        'provider'       => 'resend',
        'resend_api_key' => 're_secret-key',
        'from_address'   => 'hello@example.com',
        'from_name'      => 'Field Notes',
    ])->save();

    $before = config('services.resend');
    app(EmailConfiguration::class)->run(function (): void {
        expect(config('mail.default'))->toBe('resend')
            ->and(config('services.resend.key'))->toBe('re_secret-key')
            ->and(config('mail.from.address'))->toBe('hello@example.com');
    });

    expect(config('services.resend'))->toBe($before);
});

test('administrators can send a test message through the saved provider', function () {
    Mail::fake();

    app(EmailSettings::class)->fill(Arr::except(emailSettingsPayload([
        'password'                 => 'smtp-secret',
        'clear_password'           => false,
        'resend_api_key'           => '',
        'clear_resend_api_key'     => false,
    ]), ['clear_password', 'clear_resend_api_key']))->save();

    $this->actingAs(User::factory()->create())
        ->postJson(route('admin.settings.email.test'), ['recipient' => 'recipient@example.com'])
        ->assertOk()
        ->assertJsonPath('message', 'Test email sent successfully to recipient@example.com.');

    Mail::assertSent(EmailDeliveryTest::class, fn (EmailDeliveryTest $mail) => $mail->hasTo('recipient@example.com') && $mail->provider === 'smtp');
});

test('test delivery requires enabled saved settings and a valid recipient', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->postJson(route('admin.settings.email.test'), ['recipient' => 'invalid'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('recipient');

    $this->postJson(route('admin.settings.email.test'), ['recipient' => 'recipient@example.com'])
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Enable and save a custom email provider before sending a test.');
});
