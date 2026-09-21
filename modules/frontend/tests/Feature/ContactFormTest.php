<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Frontend\Events\ContactSubmissionReceived;
use Modules\Frontend\Listeners\SendContactSubmissionNotification;
use Modules\Frontend\Mail\NewContactSubmission;
use Modules\Frontend\Models\ContactSubmission;
use Modules\Frontend\Services\Turnstile;

uses(RefreshDatabase::class);

beforeEach(function () {
    config([
        'contact.minimum_form_seconds'   => 2,
        'contact.notification_email'     => 'owner@example.org',
        'contact.turnstile.enabled'      => false,
        'contact.turnstile.site_key'     => '',
        'contact.turnstile.secret_key'   => '',
    ]);

    $this->payload = [
        'name'            => '  Ada Lovelace  ',
        'email'           => 'ADA@EXAMPLE.ORG',
        'topic'           => 'project',
        'subject'         => 'A new publishing project',
        'message'         => 'I would like to discuss a new publishing project and the timeline for building it.',
        'source_url'      => config('app.url').'/contact?topic=project',
        'website'         => '',
        'started_at'      => Crypt::encryptString((string) now()->subSeconds(3)->timestamp),
        'turnstile_token' => '',
    ];
});

test('contact page exposes the form configuration without exposing captcha secrets', function () {
    $this->get('/contact?topic=visa')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('frontend::contact')
            ->where('defaultTopic', 'visa')
            ->where('topics.3.value', 'visa')
            ->where('topics.3.label', 'Visa support')
            ->where('captcha.enabled', false)
            ->where('captcha.siteKey', null)
            ->has('contactForm.startedAt')
            ->missing('captcha.secretKey'));
});

test('a valid contact message is normalized stored and dispatches the extension event', function () {
    Event::fake([ContactSubmissionReceived::class]);

    $this->from('/contact')->post(route('contact.store'), $this->payload)
        ->assertRedirect(route('contact'))
        ->assertSessionHas('contact_status');

    $submission = ContactSubmission::sole();

    expect($submission->name)->toBe('Ada Lovelace')
        ->and($submission->email)->toBe('ada@example.org')
        ->and($submission->status)->toBe(ContactSubmission::STATUS_NEW)
        ->and($submission->ip_hash)->toHaveLength(64)
        ->and($submission->source_url)->toBe(config('app.url').'/contact?topic=project');

    Event::assertDispatched(ContactSubmissionReceived::class, fn ($event) => $event->submission->is($submission));
});

test('contact form rejects spam traps invalid timing and short messages', function (array $changes, string $field) {
    $this->post(route('contact.store'), array_replace($this->payload, $changes))->assertSessionHasErrors($field);
    expect(ContactSubmission::count())->toBe(0);
})->with([
    [['website' => 'spam.example'], 'website'],
    [['started_at' => 'forged'], 'started_at'],
    [['started_at' => null], 'started_at'],
    [['message' => 'Too short'], 'message'],
    [['email' => 'invalid'], 'email'],
]);

test('turnstile tokens are verified on the server with the expected action', function () {
    config([
        'contact.turnstile.enabled'    => true,
        'contact.turnstile.site_key'   => 'site-key',
        'contact.turnstile.secret_key' => 'secret-key',
    ]);
    Http::fake([
        'challenges.cloudflare.com/*' => Http::response(['success' => true, 'action' => 'contact', 'hostname' => 'localhost']),
    ]);

    $this->post(route('contact.store'), array_replace($this->payload, ['turnstile_token' => 'valid-token']))
        ->assertRedirect(route('contact'));

    expect(ContactSubmission::count())->toBe(1);
    Http::assertSent(fn ($request) => $request['secret'] === 'secret-key' && $request['response'] === 'valid-token');
});

test('invalid turnstile verification fails closed', function () {
    config([
        'contact.turnstile.enabled'    => true,
        'contact.turnstile.site_key'   => 'site-key',
        'contact.turnstile.secret_key' => 'secret-key',
    ]);
    Http::fake([
        'challenges.cloudflare.com/*' => Http::response(['success' => false, 'error-codes' => ['invalid-input-response']]),
    ]);

    $this->post(route('contact.store'), array_replace($this->payload, ['turnstile_token' => 'invalid-token']))
        ->assertSessionHasErrors('turnstile_token');

    expect(ContactSubmission::count())->toBe(0);
});

test('contact administration requires authentication and provides counts and details', function () {
    $submission = ContactSubmission::create([
        'name'    => 'Ada', 'email' => 'ada@example.org', 'topic' => 'project', 'subject' => 'Project',
        'message' => 'A detailed message for the project.', 'status' => ContactSubmission::STATUS_NEW,
        'ip_hash' => str_repeat('a', 64),
    ]);
    ContactSubmission::create([
        'name'    => 'Grace', 'email' => 'grace@example.org', 'topic' => 'general', 'subject' => 'Question',
        'message' => 'A detailed general question.', 'status' => ContactSubmission::STATUS_RESOLVED,
    ]);

    $this->get(route('admin.contact.index'))->assertRedirect(route('login'));
    $this->actingAs(User::factory()->create());

    $this->get(route('admin.contact.index'))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('frontend::admin/contact/index')
        ->where('counts', ['new' => 1, 'open' => 1, 'resolved' => 1])
        ->has('table.results.data', 2));

    $this->get(route('admin.contact.show', $submission))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('frontend::admin/contact/show')
        ->where('submission.email', 'ada@example.org')
        ->missing('submission.ip_hash'));
});

test('administrators can move messages through the inbox workflow', function () {
    $submission = ContactSubmission::create([
        'name'    => 'Ada', 'email' => 'ada@example.org', 'topic' => 'project', 'subject' => 'Project',
        'message' => 'A detailed message for the project.', 'status' => ContactSubmission::STATUS_NEW,
    ]);
    $this->actingAs(User::factory()->create());

    $this->patch(route('admin.contact.update', $submission), ['status' => 'read'])->assertRedirect();
    expect($submission->fresh()->status)->toBe(ContactSubmission::STATUS_READ)
        ->and($submission->fresh()->read_at)->not->toBeNull();

    $this->patch(route('admin.contact.update', $submission), ['status' => 'resolved'])->assertRedirect();
    expect($submission->fresh()->status)->toBe(ContactSubmission::STATUS_RESOLVED)
        ->and($submission->fresh()->resolved_at)->not->toBeNull();

    $this->patch(route('admin.contact.update', $submission), ['status' => 'read'])->assertRedirect();
    expect($submission->fresh()->status)->toBe(ContactSubmission::STATUS_READ)
        ->and($submission->fresh()->resolved_at)->toBeNull();
});

test('the queued event listener emails the configured recipient and records delivery', function () {
    Mail::fake();
    $submission = ContactSubmission::create([
        'name'    => 'Ada', 'email' => 'ada@example.org', 'topic' => 'project', 'subject' => 'Project',
        'message' => 'A detailed message for the project.', 'status' => ContactSubmission::STATUS_NEW,
    ]);

    app(SendContactSubmissionNotification::class)->handle(
        new ContactSubmissionReceived($submission),
    );

    Mail::assertSent(NewContactSubmission::class, fn ($mail) => $mail->hasTo('owner@example.org'));
    expect((new NewContactSubmission($submission))->render())->toContain('View in contact inbox');
    expect($submission->fresh()->notified_at)->not->toBeNull();
});

test('turnstile stays disabled when either credential is missing', function () {
    config([
        'contact.turnstile.enabled'    => true,
        'contact.turnstile.site_key'   => 'site-key',
        'contact.turnstile.secret_key' => '',
    ]);

    expect(app(Turnstile::class)->configured())->toBeFalse()
        ->and(app(Turnstile::class)->enabled())->toBeFalse();
});
