<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Analytics\Models\PageView;
use Modules\Analytics\Services\GoogleAnalyticsReport;
use Modules\Analytics\Services\TrafficReport;
use Modules\Auth\Models\User;
use Spatie\Analytics\Facades\Analytics;

uses(RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
    Analytics::swap(Mockery::mock(\Spatie\Analytics\Analytics::class));
    $this->travelTo(now('UTC')->setDate(2026, 9, 16)->setTime(12, 0, 5));
    config(['traffic.enabled' => true, 'traffic.routes' => ['traffic.test']]);
    Route::middleware('web')->get('/tracking-test', fn () => response('<h1>Test</h1>'))->name('traffic.test');
    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10']);
    $this->withHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
});

test('dashboard and initial google page make no reporting calls', function () {
    $this->mock(GoogleAnalyticsReport::class)->shouldNotReceive('get');
    $this->actingAs(User::factory()->create())->get('/dashboard')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('dashboard')->missing('analytics'));
    $this->get('/admin/seo/google')->assertOk()->assertInertia(fn (Assert $page) => $page->component('seo/google')->missing('analytics'));
});

test('seo reporting routes require authentication', function () {
    $this->get('/admin/seo')->assertRedirect('/login');
    $this->get('/admin/seo/google')->assertRedirect('/login');
});

test('records a page once per minute without retaining sensitive request data', function () {
    $this->withHeader('Referer', 'https://example.org/source?email=private@example.org')->get('/tracking-test?token=secret')->assertOk();
    $this->get('/tracking-test?other=secret')->assertOk();
    expect(PageView::count())->toBe(1);
    $view = PageView::first();
    expect($view->path)->toBe('/tracking-test')->and($view->referrer_host)->toBe('example.org')
        ->and($view->browser)->toBe('Chrome')->and($view->platform)->toBe('Windows')->and($view->device)->toBe('desktop')
        ->and(strlen($view->visitor_hash))->toBe(64)->and($view->toJson())->not->toContain('203.0.113.10', 'private@example.org', 'secret', 'Mozilla');
    $this->travel(1)->minutes();
    $this->get('/tracking-test');
    expect(PageView::count())->toBe(2)->and(PageView::distinct()->count('visitor_hash'))->toBe(1);
});

test('IP identity rotates each UTC day and ignores forwarded IP spoofing', function () {
    $this->get('/tracking-test');
    $first = PageView::first()->visitor_hash;
    $this->withHeader('X-Forwarded-For', '198.51.100.9')->get('/tracking-test');
    expect(PageView::count())->toBe(1);
    $this->travel(1)->days();
    $this->get('/tracking-test');
    expect(PageView::latest('id')->first()->visitor_hash)->not->toBe($first);
});

test('skips privacy opt outs bots prefetches and partial reloads', function (array $headers) {
    $this->withHeaders($headers)->get('/tracking-test')->assertOk();
    expect(PageView::count())->toBe(0);
})->with([
    [['DNT' => '1']], [['Sec-GPC' => '1']], [['Purpose' => 'prefetch']], [['Sec-Purpose' => 'prefetch;prerender']],
    [['X-Inertia-Partial-Data' => 'articles']], [['User-Agent' => 'Googlebot/2.1 (+http://www.google.com/bot.html)']],
]);

test('skips signed in users non pages and disabled tracking', function () {
    $this->head('/tracking-test');
    $this->get('/missing-tracking-page')->assertNotFound();
    expect(PageView::count())->toBe(0);
    config(['traffic.enabled' => false]);
    $this->get('/tracking-test');
    config(['traffic.enabled' => true]);
    $this->actingAs(User::factory()->create())->get('/tracking-test');
    expect(PageView::count())->toBe(0);
});

test('local report shows real counts breakdowns and zero filled dates', function () {
    $this->get('/tracking-test');
    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.11'])->get('/tracking-test');
    $report = app(TrafficReport::class)->get(7);
    expect($report['views'])->toBe(2)->and($report['dailyVisitors'])->toBe(2)->and($report['chart'])->toHaveCount(7)
        ->and($report['browsers'][0])->toBe(['label' => 'Chrome', 'views' => 2]);
    $this->actingAs(User::factory()->create())->get('/admin/seo?period=7d')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('seo/index')->where('days', 7)->where('traffic.views', 2));
});

test('unconfigured google reports are empty not fabricated', function () {
    config(['analytics.property_id' => null]);
    Analytics::shouldReceive('get')->never();
    $report = app(GoogleAnalyticsReport::class)->get(30);
    expect($report['configured'])->toBeFalse()->and($report['chartData'])->toBe([])->and($report['stats']['totalVisitors'])->toBe(0);
});

test('google report uses date series and period totals and caches result', function () {
    config(['analytics.property_id' => 'test', 'analytics.service_account_credentials_json' => __FILE__]);
    Analytics::shouldReceive('fetchTotalVisitorsAndPageViews')->once()->withArgs(fn ($period, $limit) => $limit === 30)
        ->andReturn(collect([['date' => '20260916', 'activeUsers' => 5, 'screenPageViews' => 10]]));
    Analytics::shouldReceive('get')->once()->withArgs(fn ($period, $metrics) => count($metrics) === 4)
        ->andReturn(collect([['activeUsers' => 20, 'screenPageViews' => 50, 'averageSessionDuration' => 90, 'bounceRate' => 0.4]]));
    Analytics::shouldReceive('get')->once()->withArgs(fn ($period, $metrics) => $metrics === ['activeUsers'])
        ->andReturn(collect([['activeUsers' => 10]]));
    Analytics::shouldReceive('fetchMostVisitedPages')->once()->andReturn(collect());
    Analytics::shouldReceive('fetchTopReferrers')->once()->andReturn(collect());
    Analytics::shouldReceive('fetchTopCountries')->once()->andReturn(collect([['country' => 'India', 'screenPageViews' => 12]]));
    $report = app(GoogleAnalyticsReport::class)->get(30);
    expect($report['stats']['totalVisitors'])->toBe(20)->and($report['stats']['bounceRate'])->toBe(40.0)
        ->and($report['topCountries'][0]['sessions'])->toBe(12);
    expect(app(GoogleAnalyticsReport::class)->get(30))->toBe($report);
});

test('pruning retains only the configured traffic window', function () {
    $this->get('/tracking-test');
    $this->travel(90)->days();
    $this->get('/tracking-test');
    $this->artisan('traffic:prune')->assertSuccessful();
    expect(PageView::count())->toBe(1);
});
