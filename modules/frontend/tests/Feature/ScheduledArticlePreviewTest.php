<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Inertia;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Blog\Models\Article;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->travelTo(now()->setDate(2026, 10, 16)->setTime(9, 0));
    $this->scheduled = Article::factory()->published()->create([
        'title'        => 'Private scheduled article', 'content' => '<p>Private preview content</p>',
        'published_at' => '2026-10-18 18:30:00',
    ]);
    $this->published = Article::factory()->published()->create(['published_at' => now()->subDay()]);
    $this->draft     = Article::factory()->create(['published_at' => '2026-10-18 18:30:00']);
    $this->archived  = Article::factory()->archived()->create(['published_at' => '2026-10-18 18:30:00']);
    $this->deleted   = Article::factory()->published()->create(['published_at' => '2026-10-18 18:30:00']);
    $this->deleted->delete();
});

test('guest listings contain only articles whose publish time has arrived', function (string $routeName) {
    $this->get(route($routeName))->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('articles', 1)
            ->where('articles.0.slug', $this->published->slug)
            ->where('articles.0.preview', null))
        ->assertDontSee($this->scheduled->title);
})->with(['home', 'articles.index']);

test('signed in listings include scheduled previews and cannot be cached publicly', function (string $routeName) {
    $response = $this->actingAs(User::factory()->create())->get(route($routeName));
    $response->assertOk()->assertInertia(fn (Assert $page) => $page
        ->has('articles', 2)
        ->where('articles.0.slug', $this->scheduled->slug)
        ->where('articles.0.date', '2026-10-18T18:30:00.000000Z')
        ->where('articles.0.preview.publishedAt', '2026-10-18T18:30:00.000000Z')
        ->where('articles.0.preview.editHref', route('admin.blog.edit', $this->scheduled->id))
        ->where('articles.1.slug', $this->published->slug)
        ->where('articles.1.preview', null));
    expect($response->headers->get('Cache-Control'))->toContain('private', 'no-store');

    auth()->logout();
    $this->get(route($routeName))->assertInertia(fn (Assert $page) => $page->has('articles', 1));
})->with(['home', 'articles.index']);

test('signed in readers can open scheduled articles with preview metadata and an edit link', function () {
    $response = $this->actingAs(User::factory()->create())->get(route('articles.show', $this->scheduled->slug));
    $response->assertOk()->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertInertia(fn (Assert $page) => $page
            ->component('frontend::articles/show')
            ->where('article.content', '<p>Private preview content</p>')
            ->where('article.date', '2026-10-18T18:30:00.000000Z')
            ->where('article.preview.publishedAt', '2026-10-18T18:30:00.000000Z')
            ->where('article.preview.editHref', route('admin.blog.edit', $this->scheduled->id))
            ->where('seo.robots', 'noindex, nofollow'));
    expect($response->headers->get('Cache-Control'))->toContain('private', 'no-store');

    auth()->logout();
    $this->get(route('articles.show', $this->scheduled->slug))->assertNotFound()
        ->assertDontSee('Private preview content');
});

test('a preview query parameter cannot expose scheduled content to a guest', function () {
    $this->get(route('articles.show', $this->scheduled->slug).'?preview=1')->assertNotFound()
        ->assertDontSee('Private preview content');
});

test('Inertia navigation preserves preview access and private response headers', function () {
    $this->actingAs(User::factory()->create())->get(route('articles.index'))->assertOk();
    $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => Inertia::getVersion()])
        ->get(route('articles.show', $this->scheduled->slug))->assertOk()->assertHeader('X-Inertia', 'true')
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertJsonPath('props.article.preview.editHref', route('admin.blog.edit', $this->scheduled->id));

    auth()->logout();
    $this->flushHeaders()->get(route('articles.index'))->assertOk();
    $this->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => Inertia::getVersion()])
        ->get(route('articles.index'))->assertOk()->assertJsonCount(1, 'props.articles')
        ->assertJsonPath('props.articles.0.slug', $this->published->slug);
    $this->get(route('articles.show', $this->scheduled->slug))->assertNotFound();
});

test('signed in previews do not expose drafts archives or deleted articles', function (string $property) {
    $this->actingAs(User::factory()->create())
        ->get(route('articles.show', $this->{$property}->slug))->assertNotFound();
})->with(['draft', 'archived', 'deleted']);

test('the scheduled badge disappears and guests gain access at the publication time', function () {
    $this->actingAs(User::factory()->create());
    $this->travelTo($this->scheduled->published_at);
    $this->get(route('articles.show', $this->scheduled->slug))->assertOk()
        ->assertHeaderMissing('X-Robots-Tag')
        ->assertInertia(fn (Assert $page) => $page
            ->where('article.preview', null)
            ->where('seo.robots', config('seo.robots', 'index,follow')));

    auth()->logout();
    $this->get(route('articles.show', $this->scheduled->slug))->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('article.preview', null));
    $this->get(route('articles.index'))->assertInertia(fn (Assert $page) => $page
        ->has('articles', 2)
        ->where('articles.0.slug', $this->scheduled->slug)
        ->where('articles.0.preview', null));
});
