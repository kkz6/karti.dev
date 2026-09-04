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
    $response->assertInertia(fn (AssertableInertia $page) => $page->has('seo')
        ->has('seo.title')
        ->has('seo.description')
        ->has('seo.url')
    );
});

test('home page returns JSON-LD structured data', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) => $page->has('jsonLd')
        ->where('jsonLd.@context', 'https://schema.org')
        ->where('jsonLd.@type', 'Person')
    );
});

test('articles listing page returns SEO data', function () {
    $response = $this->get('/articles');

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) => $page->has('seo')
        ->has('seo.title')
        ->has('seo.description')
    );
});

test('article show page returns SEO data', function () {
    $category = Category::factory()->create();
    $article  = Article::factory()->published()->create([
        'title'       => 'Test Article',
        'slug'        => 'test-article',
        'excerpt'     => 'This is the article excerpt',
        'content'     => '<p>Article content</p>',
        'category_id' => $category->id,
    ]);

    $response = $this->get("/articles/{$article->slug}");

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) => $page->has('seo')
        ->has('seo.title')
        ->has('seo.description')
        ->has('seo.url')
    );
});

test('article show page returns Article JSON-LD structured data', function () {
    $category = Category::factory()->create();
    $article  = Article::factory()->published()->create([
        'title'       => 'Test Article',
        'slug'        => 'test-article',
        'excerpt'     => 'This is the article excerpt',
        'content'     => '<p>Article content</p>',
        'category_id' => $category->id,
    ]);

    $response = $this->get("/articles/{$article->slug}");

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) => $page->has('jsonLd')
        ->where('jsonLd.@context', 'https://schema.org')
        ->where('jsonLd.@type', 'Article')
        ->where('jsonLd.headline', 'Test Article')
    );
});

test('article with custom SEO data uses it', function () {
    $category = Category::factory()->create();
    $article  = Article::factory()->published()->create([
        'title'       => 'Test Article',
        'slug'        => 'test-article',
        'excerpt'     => 'This is the article excerpt',
        'content'     => '<p>Article content</p>',
        'category_id' => $category->id,
    ]);

    $article->updateSeo([
        'title'         => 'Custom SEO Title',
        'description'   => 'Custom SEO Description',
        'image'         => 'https://cdn.example.com/article.jpg',
        'canonical_url' => 'https://example.com/canonical-article',
    ]);

    $response = $this->get("/articles/{$article->slug}");

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) => $page->where('seo.title', 'Custom SEO Title')
        ->where('seo.description', 'Custom SEO Description')
        ->where('seo.image', 'https://cdn.example.com/article.jpg')
        ->where('seo.url', 'https://example.com/canonical-article')
        ->where('seo.type', 'article')
    );
});

test('article SEO is rendered in the initial HTML response', function () {
    $category = Category::factory()->create();
    $article  = Article::factory()->published()->create([
        'title'       => 'Test Article',
        'slug'        => 'server-rendered-seo',
        'excerpt'     => 'This is the article excerpt',
        'content'     => '<p>Article content</p>',
        'category_id' => $category->id,
    ]);

    $article->updateSeo([
        'title'         => 'Server-rendered SEO title',
        'description'   => 'Metadata available without JavaScript.',
        'image'         => 'https://cdn.example.com/article.jpg',
        'canonical_url' => 'https://example.com/canonical-article',
    ]);

    $response = $this->get("/articles/{$article->slug}");
    $content  = $response->getContent();

    $response->assertOk()
        ->assertSee('<title inertia>Server-rendered SEO title</title>', false)
        ->assertSee('<meta name="description" content="Metadata available without JavaScript." inertia="description">', false)
        ->assertSee('<meta property="og:type" content="article" inertia="og:type">', false)
        ->assertSee('<meta property="og:image" content="https://cdn.example.com/article.jpg" inertia="og:image">', false)
        ->assertSee('<link rel="canonical" href="https://example.com/canonical-article" inertia="canonical">', false);

    preg_match('/<script type="application\/ld\+json" inertia="json-ld">(.*?)<\/script>/s', $content, $matches);
    $jsonLd = json_decode($matches[1] ?? '', true, flags: JSON_THROW_ON_ERROR);

    expect($jsonLd)
        ->toMatchArray([
            '@type'    => 'Article',
            'headline' => 'Server-rendered SEO title',
            'image'    => 'https://cdn.example.com/article.jpg',
            'url'      => 'https://example.com/canonical-article',
        ])
        ->and($jsonLd['mainEntityOfPage']['@id'])->toBe('https://example.com/canonical-article');
});

test('server-rendered SEO safely escapes article content', function () {
    $category = Category::factory()->create();
    $article  = Article::factory()->published()->create([
        'slug'        => 'safe-seo',
        'category_id' => $category->id,
    ]);
    $article->updateSeo([
        'title'       => '</title><script>alert("seo")</script>',
        'description' => '"><script>alert("description")</script>',
    ]);

    $response = $this->get("/articles/{$article->slug}");

    $response->assertOk()
        ->assertDontSee('</title><script>alert("seo")</script>', false)
        ->assertDontSee('<script>alert("description")</script>', false)
        ->assertSee('\\u003C/script\\u003E', false);
});

test('article SEO falls back to excerpt when no custom description', function () {
    $category = Category::factory()->create();
    $article  = Article::factory()->published()->create([
        'title'       => 'Test Article',
        'slug'        => 'test-article',
        'excerpt'     => 'This is the article excerpt',
        'content'     => '<p>Article content</p>',
        'category_id' => $category->id,
    ]);

    $response = $this->get("/articles/{$article->slug}");

    $response->assertStatus(200);
    $response->assertInertia(fn (AssertableInertia $page) => $page->where('seo.description', 'This is the article excerpt')
    );
});
