<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Modules\Blog\Models\Article;
use Modules\Blog\Models\Category;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['seo.title' => 'Karti.dev']);
    config(['seo.description' => 'Software developer and founder']);
    config(['seo.author' => 'Karthick']);
    config(['seo.image' => '/images/default-og.jpg']);
    config(['seo.robots' => 'index,follow']);
    config(['seo.type' => 'website']);
    config(['seo.locale' => 'en_US']);
    config(['seo.site_name' => 'Karti.dev']);
    config(['seo.twitter.card' => 'summary_large_image']);
    config(['seo.twitter.site' => '@ikkarti']);
    config(['seo.twitter.creator' => '@ikkarti']);
});

test('home page returns SEO data', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) =>
        $page->has('seo')
            ->has('seo.title')
            ->has('seo.description')
            ->has('seo.url')
    );
});

test('home page returns JSON-LD structured data', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) =>
        $page->has('jsonLd')
            ->where('jsonLd.@context', 'https://schema.org')
            ->where('jsonLd.@type', 'Person')
    );
});

test('articles listing page returns SEO data', function () {
    $response = $this->get('/articles');

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) =>
        $page->has('seo')
            ->has('seo.title')
            ->has('seo.description')
    );
});

test('article show page returns SEO data', function () {
    $category = Category::factory()->create();
    $article = Article::factory()->published()->create([
        'title'       => 'Test Article',
        'slug'        => 'test-article',
        'excerpt'     => 'This is the article excerpt',
        'content'     => '<p>Article content</p>',
        'category_id' => $category->id,
    ]);

    $response = $this->get("/articles/{$article->slug}");

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) =>
        $page->has('seo')
            ->has('seo.title')
            ->has('seo.description')
            ->has('seo.url')
    );
});

test('article show page returns Article JSON-LD structured data', function () {
    $category = Category::factory()->create();
    $article = Article::factory()->published()->create([
        'title'       => 'Test Article',
        'slug'        => 'test-article',
        'excerpt'     => 'This is the article excerpt',
        'content'     => '<p>Article content</p>',
        'category_id' => $category->id,
    ]);

    $response = $this->get("/articles/{$article->slug}");

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) =>
        $page->has('jsonLd')
            ->where('jsonLd.@context', 'https://schema.org')
            ->where('jsonLd.@type', 'Article')
            ->where('jsonLd.headline', 'Test Article')
    );
});

test('article with custom SEO data uses it', function () {
    $category = Category::factory()->create();
    $article = Article::factory()->published()->create([
        'title'       => 'Test Article',
        'slug'        => 'test-article',
        'excerpt'     => 'This is the article excerpt',
        'content'     => '<p>Article content</p>',
        'category_id' => $category->id,
    ]);

    $article->updateSeo([
        'title'       => 'Custom SEO Title',
        'description' => 'Custom SEO Description',
    ]);

    $response = $this->get("/articles/{$article->slug}");

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) =>
        $page->where('seo.title', 'Custom SEO Title')
            ->where('seo.description', 'Custom SEO Description')
    );
});

test('article SEO falls back to excerpt when no custom description', function () {
    $category = Category::factory()->create();
    $article = Article::factory()->published()->create([
        'title'       => 'Test Article',
        'slug'        => 'test-article',
        'excerpt'     => 'This is the article excerpt',
        'content'     => '<p>Article content</p>',
        'category_id' => $category->id,
    ]);

    $response = $this->get("/articles/{$article->slug}");

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) =>
        $page->where('seo.description', 'This is the article excerpt')
    );
});
