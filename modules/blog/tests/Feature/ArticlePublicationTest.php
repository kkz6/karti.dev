<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Blog\Models\Article;
use Modules\Blog\Models\Category;
use Modules\Blog\Tables\Articles;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->travelTo(now()->setDate(2026, 10, 16)->setTime(9, 0));
    $this->actingAs(User::factory()->create());
    $this->category = Category::factory()->create();
    $this->payload  = [
        'title'          => 'Scheduled article', 'slug' => 'scheduled-article', 'content' => '<p>Article content</p>',
        'excerpt'        => null, 'category_id' => $this->category->id, 'tags' => [], 'status' => 'published',
        'featured_image' => [], 'meta_title' => null, 'meta_description' => null, 'seo' => null,
        'published_at'   => '2026-10-18T18:30:00.000Z',
    ];
});

test('article saves normalize browser timestamps to database dates', function (bool $editing, string $timestamp) {
    $payload = [...$this->payload, 'published_at' => $timestamp];
    if ($editing) {
        $article  = Article::factory()->create(['category_id' => $this->category->id]);
        $response = $this->put(route('admin.blog.update', $article->id), $payload);
    } else {
        $response = $this->post(route('admin.blog.store'), $payload);
    }

    $response->assertSessionHasNoErrors();
    $article = Article::where('slug', $payload['slug'])->firstOrFail();
    $response->assertRedirect(route('admin.blog.edit', $article->id));
    expect(DB::table('articles')->where('id', $article->id)->value('published_at'))->toBe('2026-10-18 18:30:00')
        ->and($article->published_at->toISOString())->toBe('2026-10-18T18:30:00.000000Z')
        ->and($article->isScheduled())->toBeTrue();
})->with([true, false])->with(['2026-10-18T18:30:00.000Z', '2026-10-19T00:00:00+05:30']);

test('scheduled articles become public at their exact publication time', function () {
    $this->post(route('admin.blog.store'), $this->payload)->assertSessionHasNoErrors();
    $article = Article::where('slug', $this->payload['slug'])->firstOrFail();

    auth()->logout();
    $this->get(route('articles.show', $article->slug))->assertNotFound();
    $this->get(route('articles.index'))->assertInertia(fn (Assert $page) => $page->has('articles', 0));
    expect(Article::published()->whereKey($article->id)->exists())->toBeFalse();

    $this->travelTo($article->published_at->copy()->subSecond());
    $this->get(route('articles.show', $article->slug))->assertNotFound();
    $this->travelTo($article->published_at);
    $this->get(route('articles.show', $article->slug))->assertOk();
    $this->get(route('articles.index'))->assertInertia(fn (Assert $page) => $page->has('articles', 1));
    expect($article->isScheduled())->toBeFalse();
});

test('clearing a scheduled date publishes immediately', function () {
    $article = Article::factory()->published()->create(['published_at' => '2026-10-18 18:30:00']);
    $this->put(route('admin.blog.update', $article->id), [...$this->payload, 'published_at' => null])
        ->assertSessionHasNoErrors();

    expect($article->fresh()->published_at->isSameSecond(now()))->toBeTrue();
    $this->get(route('articles.show', $this->payload['slug']))->assertOk();
});

test('draft and archived saves cannot publish an article with a selected date', function (string $status) {
    $article = Article::factory()->published()->create(['published_at' => '2026-10-18 18:30:00']);
    $this->put(route('admin.blog.update', $article->id), [...$this->payload, 'status' => $status])
        ->assertSessionHasNoErrors();

    expect($article->fresh()->status)->toBe($status)
        ->and($article->fresh()->published_at)->toBeNull();
    $this->get(route('articles.show', $this->payload['slug']))->assertNotFound();
})->with(['draft', 'archived']);

test('invalid publication dates return validation errors', function () {
    $article = Article::factory()->create();
    $this->putJson(route('admin.blog.update', $article->id), [...$this->payload, 'published_at' => 'invalid-date'])
        ->assertUnprocessable()->assertJsonValidationErrors('published_at');
    expect($article->fresh()->status)->toBe('draft');
});

test('article table distinguishes scheduled articles until they become public', function () {
    $article = Article::factory()->published()->create(['published_at' => '2026-10-18 18:30:00']);
    $table   = Articles::make()->setRequest(Request::create('/'))->toArray();
    expect($table['results']['data'][0]['status']['value'])->toBe('scheduled');

    $this->travelTo($article->published_at);
    $table = Articles::make()->setRequest(Request::create('/'))->toArray();
    expect($table['results']['data'][0]['status']['value'])->toBe('published');
});
