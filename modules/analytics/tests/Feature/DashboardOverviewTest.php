<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Analytics\Models\PageView;
use Modules\Auth\Models\User;
use Modules\Blog\Models\Article;
use Modules\Frontend\Models\NewsletterSubscriber;
use Modules\Photography\Models\Photo;

uses(RefreshDatabase::class);

test('dashboard summarizes traffic subscribers and content without external analytics', function () {
    $this->travelTo(now('UTC')->setDate(2026, 9, 19)->setTime(12, 0));

    PageView::query()->insert([
        dashboardPageView('current-1', '/articles/story', now('UTC')->subDay(), 'visitor-a'),
        dashboardPageView('current-2', '/articles/story', now('UTC')->subDay(), 'visitor-b'),
        dashboardPageView('previous', '/', now('UTC')->subDays(31), 'visitor-old'),
    ]);
    NewsletterSubscriber::query()->create([
        'email'            => 'reader@example.org',
        'confirmation_key' => Str::random(64),
        'confirmed_at'     => now(),
    ]);
    Article::query()->create([
        'title'  => 'Published story', 'slug' => 'published-story', 'content' => 'Story',
        'status' => 'published', 'published_at' => now()->subDay(),
    ]);
    Photo::query()->create(['title' => 'Draft gallery', 'slug' => 'draft-gallery', 'status' => 'draft']);

    $this->actingAs(User::factory()->create())->get('/dashboard')->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('overview.period.days', 30)
            ->where('overview.traffic.views', 2)
            ->where('overview.traffic.dailyVisitors', 2)
            ->where('overview.traffic.viewsTrend.direction', 'up')
            ->where('overview.traffic.viewsTrend.percent', 100)
            ->where('overview.traffic.topPages.0.path', '/articles/story')
            ->where('overview.traffic.topPages.0.views', 2)
            ->where('overview.traffic.topPages.0.visitors', 2)
            ->where('overview.newsletter.active', 1)
            ->where('overview.newsletter.newSubscribers', 1)
            ->where('overview.newsletter.confirmationRate', 100)
            ->where('overview.content.articles.published', 1)
            ->where('overview.content.galleries.drafts', 1)
            ->has('overview.recentContent', 2)
            ->missing('analytics'));
});

function dashboardPageView(string $event, string $path, Carbon\CarbonInterface $viewedAt, string $visitor): array
{
    return [
        'event_key'     => hash('sha256', $event), 'visitor_hash' => hash('sha256', $visitor),
        'viewed_on'     => $viewedAt->toDateString(), 'viewed_at' => $viewedAt, 'path' => $path,
        'referrer_host' => null, 'browser' => 'Chrome', 'platform' => 'macOS', 'device' => 'desktop',
    ];
}
