<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Analytics\Models\PageView;
use Modules\Analytics\Services\ContentTraffic;
use Modules\Analytics\Services\TrafficReport;
use Modules\Auth\Models\User;
use Modules\Blog\Models\Article;
use Modules\Blog\Tables\Articles;
use Modules\Photography\Models\Photo;
use Modules\Photography\Tables\Photos;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->travelTo(now('UTC')->setDate(2026, 9, 16)->setTime(12, 0, 5));
    config(['traffic.enabled' => true]);
});

function contentTrafficEvent(array $values = []): PageView
{
    return PageView::create([...[
        'event_key'     => hash('sha256', uniqid('', true)), 'visitor_hash' => hash('sha256', 'visitor'),
        'viewed_at'     => now('UTC'), 'viewed_on' => now('UTC')->toDateString(), 'path' => '/articles/example',
        'referrer_host' => 'example.org', 'browser' => 'Chrome', 'platform' => 'Windows', 'device' => 'desktop',
    ], ...$values]);
}

test('real public article and gallery requests attach stable content identities', function () {
    $article = Article::factory()->published()->create(['slug' => 'tracked-article']);
    $gallery = Photo::create(['title' => 'Japan', 'slug' => 'tracked-gallery', 'status' => 'published', 'published_at' => now()->subDay()]);
    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])
        ->withHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
    $this->get('/articles/tracked-article')->assertOk();
    $this->get('/photography/tracked-gallery')->assertOk();
    $this->get('/articles/tracked-article')->assertOk();
    expect(PageView::count())->toBe(2);
    $this->assertDatabaseHas('page_views', ['path' => '/articles/tracked-article', 'content_type' => 'article', 'content_id' => $article->id]);
    $this->assertDatabaseHas('page_views', ['path' => '/photography/tracked-gallery', 'content_type' => 'gallery', 'content_id' => $gallery->id]);
    $article->update(['slug' => 'renamed-article']);
    $this->travel(1)->minutes();
    $this->get('/articles/renamed-article')->assertOk();
    expect(app(ContentTraffic::class)->forContent('article', $article)['views'])->toBe(2);
});

test('per-content reports isolate entries and include historical slug paths', function () {
    $article = Article::factory()->published()->create();
    $scope   = ['content_type' => 'article', 'content_id' => $article->id];
    contentTrafficEvent([...$scope, 'path' => '/articles/old-slug']);
    contentTrafficEvent([...$scope, 'path' => '/articles/new-slug', 'visitor_hash' => hash('sha256', 'other')]);
    contentTrafficEvent(['content_type' => 'gallery', 'content_id' => $article->id]);
    contentTrafficEvent(['content_type' => 'article', 'content_id' => $article->id + 1]);
    contentTrafficEvent([...$scope, 'viewed_on' => now('UTC')->subDays(8)->toDateString()]);
    $this->actingAs(User::factory()->create())->get(route('admin.seo.content', ['type' => 'article', 'id' => $article->id, 'period' => '7d']))
        ->assertOk()->assertInertia(fn (Assert $page) => $page->component('seo/index')->where('days', 7)
        ->where('traffic.views', 2)->where('traffic.dailyVisitors', 2)->has('traffic.chart', 7)
        ->has('traffic.pages', 2)->where('traffic.referrers.0.views', 2)->where('scope.title', $article->title));
});

test('editor and table counts use the same 30-day scope with zero for untouched entries', function () {
    $article   = Article::factory()->published()->create();
    $untouched = Article::factory()->create();
    contentTrafficEvent(['content_type' => 'article', 'content_id' => $article->id]);
    contentTrafficEvent(['content_type' => 'article', 'content_id' => $article->id, 'viewed_on' => now('UTC')->subDays(30)->toDateString()]);
    $rows = app(Articles::class)->resource()->orderByDesc('local_views')->get()->keyBy('id');
    expect((int) $rows[$article->id]->local_views)->toBe(1)->and((int) $rows[$untouched->id]->local_views)->toBe(0);
    $this->actingAs(User::factory()->create())->get(route('admin.blog.edit', $article->id))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('localTraffic.views', 1)->where('localTraffic.days', 30)->where('localTraffic.sharedPage', false));
    $this->get(route('admin.blog.index'))->assertOk();
});

test('gallery table and editor expose local views', function () {
    $photo = Photo::create(['title' => 'Japan', 'slug' => 'japan-counts']);
    contentTrafficEvent(['content_type' => 'gallery', 'content_id' => $photo->id, 'path' => '/photography/japan-counts']);
    expect((int) app(Photos::class)->resource()->first()->local_views)->toBe(1);
    $this->actingAs(User::factory()->create())->get(route('admin.photography.edit', $photo->id))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('localTraffic.views', 1)->where('localTraffic.sharedPage', false));
    $this->get(route('admin.photography.index'))->assertOk();
});

test('page reports filter exactly and still agree with the site total', function () {
    contentTrafficEvent(['path' => '/projects']);
    contentTrafficEvent(['path' => '/projects-other']);
    contentTrafficEvent(['path' => '/']);
    expect(app(TrafficReport::class)->get(30)['views'])->toBe(3);
    $this->actingAs(User::factory()->create())->get(route('admin.seo.page', ['path' => '/projects']))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('traffic.views', 1)->where('scope.title', '/projects')->where('scope.path', '/projects'));
    $this->get(route('admin.projects.index'))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('localTraffic.views', 1)->where('localTraffic.sharedPage', true));
});

test('page analytics retain the selected path when changing reporting periods', function (string $path) {
    $this->actingAs(User::factory()->create());
    foreach (['7d' => 7, '30d' => 30] as $period => $days) {
        $this->get(route('admin.seo.page', ['path' => $path, 'period' => $period]))->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('scope.path', $path)->where('days', $days));
    }
    $this->get(route('admin.seo.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->missing('scope'));
})->with(['/', '/projects', '/articles/example']);

test('shared-page summaries are available for speaking and tools', function () {
    contentTrafficEvent(['path' => '/speaking']);
    contentTrafficEvent(['path' => '/uses']);
    $this->actingAs(User::factory()->create());
    foreach (['admin.speaking.index', 'admin.tools.index'] as $route) {
        $this->get(route($route))->assertOk()->assertInertia(fn (Assert $page) => $page->where('localTraffic.views', 1)->where('localTraffic.sharedPage', true));
    }
});

test('page analytics respect authentication and validate the scope', function () {
    $this->get('/admin/seo/page?path=/')->assertRedirect('/login');
    $this->get('/admin/seo/content/article/1')->assertRedirect('/login');
    $this->actingAs(User::factory()->create());
    $this->getJson('/admin/seo/page?path=https://example.com')->assertUnprocessable();
    $this->getJson('/admin/seo/page?path=/&period=365d')->assertUnprocessable();
    $this->get('/admin/seo/content/unknown/1')->assertNotFound();
    $this->get('/admin/seo/content/article/9999')->assertNotFound();
});

test('disabled and empty analytics remain honest', function () {
    config(['traffic.enabled' => false]);
    $article = Article::factory()->create();
    $summary = app(ContentTraffic::class)->forContent('article', $article);
    expect($summary['enabled'])->toBeFalse()->and($summary['views'])->toBe(0)->and($summary['dailyVisitors'])->toBe(0);
});

test('migration links existing paths without changing counts or unrelated history', function () {
    $article   = Article::factory()->create(['slug' => 'existing-path']);
    $migration = require base_path('modules/analytics/database/migrations/2026_09_16_160000_link_page_views_to_content.php');
    $migration->down();
    contentTrafficEvent(['path' => '/articles/existing-path']);
    contentTrafficEvent(['path' => '/old-unknown-path']);
    $migration->up();
    expect(PageView::count())->toBe(2);
    $this->assertDatabaseHas('page_views', ['path' => '/articles/existing-path', 'content_type' => 'article', 'content_id' => $article->id]);
    $this->assertDatabaseHas('page_views', ['path' => '/old-unknown-path', 'content_type' => null]);
});
