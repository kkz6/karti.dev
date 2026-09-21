<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Frontend\Jobs\SendNewsletterConfirmation;
use Modules\Frontend\Mail\ConfirmNewsletterSubscription;
use Modules\Frontend\Models\NewsletterSubscriber;

uses(RefreshDatabase::class);

test('subscriber administration requires login and never exposes confirmation secrets', function () {
    $this->get('/admin/newsletter')->assertRedirect('/login');
    NewsletterSubscriber::create(['email' => 'active@example.org', 'confirmation_key' => Str::random(64), 'confirmed_at' => now()]);
    NewsletterSubscriber::create(['email' => 'pending@example.org', 'confirmation_key' => Str::random(64)]);
    $this->actingAs(\Modules\Auth\Models\User::factory()->create())->get('/admin/newsletter?filters[status][value]=active&search=active')
        ->assertOk()->assertInertia(fn (Assert $page) => $page->component('newsletter/index')
        ->has('table.results.data', 1)->where('table.results.data.0.email', 'active@example.org')
        ->missing('table.results.data.0.confirmation_key')->where('counts.active', 1)->where('counts.pending', 1));
});

test('newsletter table filters each subscription status and keeps global counts', function (string $status, string $label) {
    foreach (['active', 'pending', 'unsubscribed'] as $state) {
        NewsletterSubscriber::create([
            'email'                => $state.'@example.org',
            'confirmation_key'     => Str::random(64),
            'confirmed_at'         => $state !== 'pending' ? now() : null,
            'unsubscribed_at'      => $state === 'unsubscribed' ? now() : null,
            'confirmation_sent_at' => $state !== 'pending' ? now() : null,
        ]);
    }

    $this->actingAs(\Modules\Auth\Models\User::factory()->create())
        ->get('/admin/newsletter?'.http_build_query(['filters' => ['status' => ['value' => $status]]]))
        ->assertOk()->assertInertia(fn (Assert $page) => $page
        ->has('table.results.data', 1)
        ->where('table.results.data.0.email', $status.'@example.org')
        ->where('table.results.data.0.status', $label)
        ->where('table.results.data.0.confirmation_sent_at', $status === 'pending' ? 'Queued / not sent' : 'Sent')
        ->where('table.state.filters.status.value', $status)
        ->where('counts', ['active' => 1, 'pending' => 1, 'unsubscribed' => 1])
        ->where('table.actions', [])
        ->where('table.exports', [])
        );
})->with([['active', 'Active'], ['pending', 'Pending'], ['unsubscribed', 'Unsubscribed']]);

test('newsletter table supports search sorting pagination and empty results', function () {
    for ($i = 1; $i <= 26; $i++) {
        NewsletterSubscriber::create([
            'email'            => sprintf('reader%02d@example.org', $i),
            'confirmation_key' => Str::random(64),
            'created_at'       => now()->subMinutes(27 - $i),
        ]);
    }
    $this->actingAs(\Modules\Auth\Models\User::factory()->create());
    $this->get('/admin/newsletter')->assertInertia(fn (Assert $page) => $page
        ->has('table.results.data', 25)->where('table.results.total', 26)
        ->where('table.results.data.0.email', 'reader26@example.org'));
    $this->get('/admin/newsletter?sort=email&page=2')->assertInertia(fn (Assert $page) => $page
        ->has('table.results.data', 1)->where('table.results.current_page', 2)
        ->where('table.results.data.0.email', 'reader26@example.org'));
    $this->get('/admin/newsletter?perPage=50&sort=email')->assertInertia(fn (Assert $page) => $page
        ->has('table.results.data', 26)->where('table.results.data.0.email', 'reader01@example.org'));
    $this->get('/admin/newsletter?search=reader01')->assertInertia(fn (Assert $page) => $page
        ->has('table.results.data', 1)->where('table.results.data.0.email', 'reader01@example.org'));
    $this->get('/admin/newsletter?search=missing')->assertInertia(fn (Assert $page) => $page
        ->has('table.results.data', 0)->where('table.state.search', 'missing'));
});

test('signed newsletter pages do not load third party analytics', function () {
    $subscriber = NewsletterSubscriber::create(['email' => 'reader@example.org', 'confirmation_key' => Str::random(64)]);
    $this->get($subscriber->confirmationUrl())->assertOk()->assertDontSee('googletagmanager.com', false);
    $this->get($subscriber->unsubscribeUrl())->assertOk()->assertDontSee('googletagmanager.com', false);
});

beforeEach(function () {
    Cache::flush();
    config(['newsletter.validate_dns' => false]);
    Queue::fake();
    Mail::fake();
    $this->payload = [
        'email'      => 'Reader@example.org', 'website' => '',
        'started_at' => Crypt::encryptString((string) now()->subSeconds(3)->timestamp),
    ];
});

test('subscription is normalized persisted and queued but not active', function () {
    $this->from('/')->post(route('newsletter.subscribe'), $this->payload)->assertRedirect(route('home'))->assertSessionHas('newsletter_status');
    $subscriber = NewsletterSubscriber::sole();
    expect($subscriber->email)->toBe('reader@example.org')->and($subscriber->confirmed_at)->toBeNull()
        ->and(NewsletterSubscriber::active()->count())->toBe(0);
    Queue::assertPushed(SendNewsletterConfirmation::class, fn ($job) => $job->subscriberId === $subscriber->id);
    Mail::assertNothingSent();
});

test('public pages provide a usable newsletter token and keep subscribers on the originating page', function (string $url) {
    $this->freezeTime();
    $response = $this->get($url)->assertOk();
    $response->assertInertia(fn (Assert $page) => $page->has('newsletterForm.started_at'));
    $token = $response->viewData('page')['props']['newsletterForm']['started_at'];
    expect(Crypt::decryptString($token))->toBe((string) now()->timestamp);

    $this->travel(3)->seconds();
    $this->from($url)->post(route('newsletter.subscribe'), array_replace($this->payload, ['started_at' => $token]))
        ->assertRedirect($url)->assertSessionHas('newsletter_status');
    expect(NewsletterSubscriber::sole()->confirmed_at)->toBeNull();
    Queue::assertPushed(SendNewsletterConfirmation::class);
})->with(['/', '/about', '/consulting', '/articles', '/projects', '/speaking', '/photography', '/uses']);

test('invalid disposable and honeypot submissions do not create records', function (array $changes, string $field) {
    $this->from('/')->post(route('newsletter.subscribe'), array_replace($this->payload, $changes))
        ->assertSessionHasErrors($field);
    expect(NewsletterSubscriber::count())->toBe(0);
    Queue::assertNothingPushed();
})->with([
    [['email' => 'not-an-email'], 'email'],
    [['email' => 'reader@mailinator.com'], 'email'],
    [['website' => 'spam.example'], 'website'],
    [['started_at' => 'forged'], 'started_at'],
    [['started_at' => ['invalid']], 'started_at'],
]);

test('form timestamp rejects instantaneous and expired submissions', function () {
    $this->freezeTime();

    foreach ([now(), now()->subDays(2)] as $started) {
        $this->post(route('newsletter.subscribe'), array_replace($this->payload, [
            'started_at' => Crypt::encryptString((string) $started->timestamp),
        ]))->assertSessionHasErrors('started_at');
    }
    expect(NewsletterSubscriber::count())->toBe(0);
});

test('duplicate subscriptions do not duplicate records or resend immediately', function () {
    $this->post(route('newsletter.subscribe'), $this->payload);
    $this->post(route('newsletter.subscribe'), $this->payload)->assertRedirect(route('home'));
    expect(NewsletterSubscriber::count())->toBe(1);
    Queue::assertPushed(SendNewsletterConfirmation::class, 1);
});

test('confirmation emails contain signed links using the configured mailer', function () {
    $subscriber = NewsletterSubscriber::create(['email' => 'reader@example.org', 'confirmation_key' => Str::random(64)]);
    (new SendNewsletterConfirmation($subscriber->id, $subscriber->confirmation_key))->handle(app(\Modules\Settings\Support\EmailConfiguration::class));
    Mail::assertSent(ConfirmNewsletterSubscription::class, fn ($mail) => $mail->hasTo('reader@example.org'));
    expect($subscriber->fresh()->confirmation_sent_at)->not->toBeNull();
    expect((new ConfirmNewsletterSubscription($subscriber))->render())->toContain('Confirm subscription', 'signature=');
});

test('mail scanners cannot confirm or unsubscribe by opening a link', function () {
    $subscriber = NewsletterSubscriber::create(['email' => 'reader@example.org', 'confirmation_key' => Str::random(64)]);
    $url        = $subscriber->confirmationUrl();
    $this->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->where('mode', 'confirm'));
    expect($subscriber->fresh()->confirmed_at)->toBeNull();
    $this->post($url)->assertOk();
    expect(NewsletterSubscriber::active()->count())->toBe(1);
    $unsubscribe = $subscriber->unsubscribeUrl();
    $this->get($unsubscribe)->assertOk();
    expect($subscriber->fresh()->unsubscribed_at)->toBeNull();
    $this->post($unsubscribe)->assertOk();
    expect(NewsletterSubscriber::active()->count())->toBe(0);
    $this->post($url)->assertForbidden();
});

test('invalid expired or stale confirmation links cannot activate subscribers', function () {
    $subscriber = NewsletterSubscriber::create(['email' => 'reader@example.org', 'confirmation_key' => Str::random(64)]);
    $url        = $subscriber->confirmationUrl();
    $this->post($url.'tampered')->assertForbidden();
    $subscriber->update(['confirmation_key' => Str::random(64)]);
    $this->post($url)->assertForbidden();
    $url = $subscriber->confirmationUrl();
    $this->travel(3)->days();
    $this->post($url)->assertForbidden();
    expect(NewsletterSubscriber::active()->count())->toBe(0);
});

test('active subscribers are not reset or emailed again', function () {
    $subscriber = NewsletterSubscriber::create(['email' => 'reader@example.org', 'confirmation_key' => Str::random(64), 'confirmed_at' => now()]);
    $this->post(route('newsletter.subscribe'), $this->payload)->assertRedirect(route('home'));
    expect($subscriber->fresh()->confirmed_at)->not->toBeNull();
    Queue::assertNothingPushed();
});

test('re-subscribing needs fresh confirmation and invalidates old links', function () {
    $subscriber     = NewsletterSubscriber::create(['email' => 'reader@example.org', 'confirmation_key' => Str::random(64), 'confirmed_at' => now(), 'unsubscribed_at' => now()]);
    $oldUnsubscribe = $subscriber->unsubscribeUrl();
    $oldConfirm     = $subscriber->confirmationUrl();
    $this->post(route('newsletter.subscribe'), $this->payload);
    expect($subscriber->fresh()->confirmed_at)->toBeNull();
    $this->post($oldUnsubscribe)->assertForbidden();
    $this->post($oldConfirm)->assertForbidden();
    Queue::assertPushed(SendNewsletterConfirmation::class, 1);
});

test('stale queued confirmation jobs do not send mail', function () {
    $subscriber    = NewsletterSubscriber::create(['email' => 'reader@example.org', 'confirmation_key' => Str::random(64), 'unsubscribed_at' => now()]);
    $configuration = app(\Modules\Settings\Support\EmailConfiguration::class);
    (new SendNewsletterConfirmation($subscriber->id, $subscriber->confirmation_key))->handle($configuration);
    (new SendNewsletterConfirmation($subscriber->id, 'old-key'))->handle($configuration);
    Mail::assertNothingSent();
});

test('subscription attempts are rate limited per email and IP', function () {
    for ($i = 0; $i < 3; $i++) {
        $this->post(route('newsletter.subscribe'), $this->payload)->assertRedirect();
    }
    $this->post(route('newsletter.subscribe'), $this->payload)->assertRedirect()->assertSessionHasErrors('email');
    Queue::assertPushed(SendNewsletterConfirmation::class, 1);
});

test('queue failures show an actionable validation error and allow retry', function () {
    Bus::shouldReceive('dispatch')->once()->andThrow(new RuntimeException('Queue unavailable'));
    $this->from('/')->post(route('newsletter.subscribe'), $this->payload)->assertSessionHasErrors('email');
    expect(NewsletterSubscriber::sole()->confirmation_requested_at)->toBeNull();
});
