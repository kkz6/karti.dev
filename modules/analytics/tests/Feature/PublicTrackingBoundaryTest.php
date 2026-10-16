<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Analytics\Models\PageView;
use Modules\Auth\Models\User;
use Modules\Blog\Models\Article;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10']);
    $this->withHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
    config(['traffic.enabled' => true]);
});

test('public frontend pages load Google tracking and record local views', function (string $path) {
    $this->get($path)->assertOk()->assertSee('googletagmanager.com/gtag/js', false)->assertSee("gtag('config'", false);
    $this->assertDatabaseHas('page_views', ['path' => $path]);
})->with(['/', '/about', '/contact']);

test('authentication pages contain no Google tracking and produce no local views', function (string $path) {
    $this->get($path)->assertOk()->assertDontSee('googletagmanager.com', false)->assertDontSee("gtag('config'", false);
    expect(PageView::count())->toBe(0);
})->with(['/login', '/forgot-password', '/two-factor-challenge']);

test('admin and signed in frontend visits never load or record analytics', function () {
    $this->actingAs(User::factory()->create());
    foreach (['/dashboard', '/admin/seo', '/admin/contact', '/'] as $path) {
        $this->get($path)->assertOk()->assertDontSee('googletagmanager.com', false)->assertDontSee("gtag('config'", false);
    }
    expect(PageView::count())->toBe(0);
});

test('Google tracking also respects browser privacy opt outs', function (string $header) {
    $this->withHeader($header, '1')->get('/')->assertOk()->assertDontSee('googletagmanager.com', false);
    expect(PageView::count())->toBe(0);
})->with(['DNT', 'Sec-GPC']);

test('crossing the public private boundary replaces the document to unload tracking scripts', function () {
    $publicVersion  = $this->get('/')->viewData('page')['version'];
    $privateVersion = $this->get('/login')->viewData('page')['version'];
    expect($publicVersion)->not->toBe($privateVersion);

    $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => $publicVersion])
        ->get('/login')->assertStatus(409)->assertHeader('X-Inertia-Location', url('/login'));
    $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => $privateVersion])
        ->get('/about')->assertStatus(409)->assertHeader('X-Inertia-Location', url('/about'));
});

test('frontend navigation within the same tracking scope remains an Inertia visit', function () {
    $version = $this->get('/')->viewData('page')['version'];
    $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => $version])
        ->get('/about')->assertOk()->assertHeader('X-Inertia', 'true');
});

test('scheduled article previews and signed in listings have no tracking', function () {
    $article = Article::factory()->published()->create(['published_at' => now()->addDays(2)]);
    $this->actingAs(User::factory()->create());

    foreach (['/', '/articles', '/articles/'.$article->slug] as $path) {
        $this->get($path)->assertOk()->assertDontSee('googletagmanager.com', false)->assertDontSee("gtag('config'", false);
    }

    expect(PageView::count())->toBe(0);
});

test('unpublished guest requests produce no tracking', function (string $status) {
    $article = Article::factory()->create(['status' => $status, 'published_at' => now()->addDays(2)]);
    $this->get('/articles/'.$article->slug)->assertNotFound()
        ->assertDontSee('googletagmanager.com', false)->assertDontSee("gtag('config'", false);

    expect(PageView::count())->toBe(0);
})->with(['published', 'draft', 'archived']);

test('scheduled articles only start guest tracking when publication time arrives', function () {
    $article = Article::factory()->published()->create(['published_at' => now()->addDays(2)]);
    $this->get('/articles/'.$article->slug)->assertNotFound();
    expect(PageView::count())->toBe(0);

    $this->travelTo($article->published_at);
    $this->get('/articles/'.$article->slug)->assertOk()
        ->assertSee('googletagmanager.com/gtag/js', false)->assertSee("gtag('config'", false);
    expect(PageView::count())->toBe(1);
    $this->assertDatabaseHas('page_views', ['path' => '/articles/'.$article->slug]);

    $this->actingAs(User::factory()->create())->get('/articles/'.$article->slug)->assertOk()
        ->assertDontSee('googletagmanager.com', false);
    expect(PageView::count())->toBe(1);
});

test('entering a scheduled preview replaces any page that had tracking loaded', function () {
    $article       = Article::factory()->published()->create(['published_at' => now()->addDays(2)]);
    $publicVersion = $this->get('/')->viewData('page')['version'];
    $this->actingAs(User::factory()->create());

    $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => $publicVersion])
        ->get('/articles/'.$article->slug)->assertStatus(409)
        ->assertHeader('X-Inertia-Location', url('/articles/'.$article->slug));
    $this->flushHeaders()->get('/articles/'.$article->slug)->assertOk()
        ->assertDontSee('googletagmanager.com', false)->assertDontSee("gtag('config'", false);

    expect(PageView::where('path', '/articles/'.$article->slug)->count())->toBe(0);
});
