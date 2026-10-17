<?php

use Database\Seeders\PortfolioSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Projects\Models\Project;
use Modules\Speaking\Models\SpeakingEvent;

uses(RefreshDatabase::class);

test('portfolio import adds the five requested projects and three verified talks', function () {
    $this->seed(PortfolioSeeder::class);

    expect(Project::published()->featured()->ordered()->pluck('title')->all())
        ->toBe(['ZoneBar', 'launchctl', 'Scouted', 'Walkero', 'Morrow'])
        ->and(SpeakingEvent::published()->ordered()->pluck('event_date')->map->format('Y-m-d')->all())
        ->toBe(['2026-03-28', '2025-09-13', '2025-06-08']);

    $this->get(route('projects'))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->has('projects', 5)
        ->where('projects.0.name', 'ZoneBar')
        ->where('projects.2.link.href', 'https://scouted.life')
        ->where('projects.4.name', 'Morrow'));
});

test('repeat portfolio imports preserve edits publication choices and deleted entries', function () {
    $this->seed(PortfolioSeeder::class);
    $project = Project::where('slug', 'zonebar')->firstOrFail();
    $project->update(['short_description' => 'My edited project description', 'status' => 'draft', 'featured' => false]);
    $talk = SpeakingEvent::whereDate('event_date', '2026-03-28')->firstOrFail();
    $talk->update(['description' => 'My edited talk description', 'url' => 'https://example.com/slides', 'status' => 'draft']);
    Project::where('slug', 'walkero')->firstOrFail()->delete();
    SpeakingEvent::whereDate('event_date', '2025-06-08')->firstOrFail()->delete();

    $this->seed(PortfolioSeeder::class);
    expect(Project::withTrashed()->count())->toBe(5)
        ->and(SpeakingEvent::withTrashed()->count())->toBe(3)
        ->and($project->fresh()->short_description)->toBe('My edited project description')
        ->and($project->fresh()->status)->toBe('draft')
        ->and($project->fresh()->featured)->toBeFalse()
        ->and($talk->fresh()->description)->toBe('My edited talk description')
        ->and($talk->fresh()->url)->toBe('https://example.com/slides')
        ->and($talk->fresh()->status)->toBe('draft')
        ->and(Project::where('slug', 'walkero')->exists())->toBeFalse()
        ->and(SpeakingEvent::whereDate('event_date', '2025-06-08')->exists())->toBeFalse();
});

test('portfolio import recognizes matching content with a different slug', function () {
    $this->seed(PortfolioSeeder::class);
    Project::where('slug', 'zonebar')->firstOrFail()->update(['slug' => 'my-world-clocks']);
    SpeakingEvent::whereDate('event_date', '2025-06-08')->firstOrFail()->update(['slug' => 'tokyo-talk']);

    $this->seed(PortfolioSeeder::class);
    expect(Project::count())->toBe(5)->and(SpeakingEvent::count())->toBe(3);
});

test('speaking page uses the editor records grouped by type with working event links and locations', function () {
    $this->seed(PortfolioSeeder::class);
    $hidden = SpeakingEvent::whereDate('event_date', '2025-09-13')->firstOrFail();
    $hidden->update(['status' => 'draft']);
    SpeakingEvent::create([
        'title'      => 'Archived talk', 'slug' => 'archived-talk', 'description' => 'Hidden content',
        'event_name' => 'Private event', 'event_date' => null, 'status' => 'archived',
    ]);

    $this->get(route('speaking'))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('frontend::speaking')
        ->has('events.conference', 2)
        ->where('events.conference.0.title', 'Upwork: Beginners Freelancing Guide')
        ->where('events.conference.0.date', '2026-03-28')
        ->where('events.conference.0.href', 'https://luma.com/tdvqg5ml')
        ->where('events.conference.0.location', 'GeekyAnts, Bengaluru, India')
        ->where('events.conference.1.title', 'Make development faster with Cursor AI')
        ->where('events.conference.1.href', 'https://www.meetup.com/phpxtky/events/307317783/'));
});

test('speaking page handles published events without dates', function () {
    SpeakingEvent::create([
        'title'      => 'Podcast conversation', 'slug' => 'podcast-conversation', 'description' => 'An interview',
        'event_name' => 'Developer podcast', 'event_date' => null, 'event_type' => 'podcast',
        'url'        => 'https://example.com/podcast', 'status' => 'published',
    ]);

    $this->get(route('speaking'))->assertOk()->assertInertia(fn (Assert $page) => $page
        ->has('events.podcast', 1)
        ->where('events.podcast.0.date', null)
        ->where('events.podcast.0.href', 'https://example.com/podcast'));
});
