<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Auth\Models\User;
use Modules\Speaking\Models\SpeakingEvent;

uses(RefreshDatabase::class);

function authenticatedSpeakingUser(): User
{
    $user = User::factory()->create();
    test()->actingAs($user);

    return $user;
}

function validSpeakingData(array $overrides = []): array
{
    return array_merge([
        'title' => 'Test Talk',
        'slug' => 'test-talk',
        'description' => 'A test speaking event description.',
        'event_name' => 'LaravelConf 2026',
        'event_date' => '2026-06-15',
        'event_type' => 'conference',
        'location' => 'San Francisco',
        'url' => 'https://example.com/talk',
        'cta_text' => 'Watch video',
        'featured' => false,
        'status' => 'published',
    ], $overrides);
}

// --- Authentication ---

test('unauthenticated users cannot access speaking events index', function () {
    $this->get(route('admin.speaking.index'))
        ->assertRedirect(route('login'));
});

test('unauthenticated users cannot store a speaking event', function () {
    $this->post(route('admin.speaking.store'), validSpeakingData())
        ->assertRedirect(route('login'));
});

// --- Index ---

test('authenticated users can view the speaking events index', function () {
    authenticatedSpeakingUser();

    $this->get(route('admin.speaking.index'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('speaking::index'));
});

// --- Create ---

test('authenticated users can view the create form', function () {
    authenticatedSpeakingUser();

    $this->get(route('admin.speaking.create'))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('speaking::create'));
});

// --- Store ---

test('authenticated users can create a speaking event', function () {
    authenticatedSpeakingUser();

    $this->post(route('admin.speaking.store'), validSpeakingData())
        ->assertRedirect(route('admin.speaking.index'));

    $this->assertDatabaseHas('speaking_events', [
        'title' => 'Test Talk',
        'slug' => 'test-talk',
        'event_name' => 'LaravelConf 2026',
        'event_type' => 'conference',
        'status' => 'published',
    ]);
});

test('speaking event creation requires title', function () {
    authenticatedSpeakingUser();

    $this->post(route('admin.speaking.store'), validSpeakingData(['title' => '']))
        ->assertSessionHasErrors('title');
});

test('speaking event creation requires event name', function () {
    authenticatedSpeakingUser();

    $this->post(route('admin.speaking.store'), validSpeakingData(['event_name' => '']))
        ->assertSessionHasErrors('event_name');
});

test('speaking event creation requires valid event type', function () {
    authenticatedSpeakingUser();

    $this->post(route('admin.speaking.store'), validSpeakingData(['event_type' => 'invalid']))
        ->assertSessionHasErrors('event_type');
});

test('speaking event creation requires unique slug', function () {
    authenticatedSpeakingUser();

    SpeakingEvent::create(validSpeakingData());

    $this->post(route('admin.speaking.store'), validSpeakingData())
        ->assertSessionHasErrors('slug');
});

test('speaking event creation requires cta text', function () {
    authenticatedSpeakingUser();

    $this->post(route('admin.speaking.store'), validSpeakingData(['cta_text' => '']))
        ->assertSessionHasErrors('cta_text');
});

test('speaking event creation validates url field', function () {
    authenticatedSpeakingUser();

    $this->post(route('admin.speaking.store'), validSpeakingData(['url' => 'not-a-url']))
        ->assertSessionHasErrors('url');
});

// --- Show ---

test('authenticated users can view a speaking event', function () {
    authenticatedSpeakingUser();

    $event = SpeakingEvent::create(validSpeakingData());

    $this->get(route('admin.speaking.show', $event))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('speaking::show')
            ->has('event')
        );
});

// --- Edit ---

test('authenticated users can view the edit form', function () {
    authenticatedSpeakingUser();

    $event = SpeakingEvent::create(validSpeakingData());

    $this->get(route('admin.speaking.edit', $event))
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('speaking::edit')
            ->has('event')
        );
});

// --- Update ---

test('authenticated users can update a speaking event', function () {
    authenticatedSpeakingUser();

    $event = SpeakingEvent::create(validSpeakingData());

    $this->put(route('admin.speaking.update', $event), validSpeakingData([
        'title' => 'Updated Talk Title',
        'event_name' => 'ReactConf 2026',
    ]))
        ->assertRedirect(route('admin.speaking.index'));

    $this->assertDatabaseHas('speaking_events', [
        'id' => $event->id,
        'title' => 'Updated Talk Title',
        'event_name' => 'ReactConf 2026',
    ]);
});

// --- Destroy ---

test('authenticated users can delete a speaking event', function () {
    authenticatedSpeakingUser();

    $event = SpeakingEvent::create(validSpeakingData());

    $this->delete(route('admin.speaking.destroy', $event))
        ->assertRedirect(route('admin.speaking.index'));

    $this->assertSoftDeleted('speaking_events', ['id' => $event->id]);
});

// --- Model ---

test('speaking event uses slug as route key', function () {
    $event = new SpeakingEvent();

    expect($event->getRouteKeyName())->toBe('slug');
});

test('speaking event scope published returns only published events', function () {
    authenticatedSpeakingUser();

    SpeakingEvent::create(validSpeakingData(['slug' => 'published-one']));
    SpeakingEvent::create(validSpeakingData(['slug' => 'draft-one', 'title' => 'Draft', 'status' => 'draft']));

    $published = SpeakingEvent::published()->get();

    expect($published)->toHaveCount(1);
    expect($published->first()->slug)->toBe('published-one');
});
