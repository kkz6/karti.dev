<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Analytics\Models\PageView;
use Modules\Auth\Models\User;

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
