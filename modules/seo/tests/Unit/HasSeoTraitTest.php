<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Blog\Models\Category;
use Modules\Seo\Models\Seo;
use Modules\Seo\Support\SEOData;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['seo.title' => 'Default Site']);
    config(['seo.description' => 'Default Description']);
    config(['seo.author' => 'Default Author']);
    config(['seo.robots' => 'index,follow']);
    config(['seo.type' => 'website']);
    config(['seo.locale' => 'en_US']);
    config(['seo.site_name' => 'Test Site']);
    config(['seo.twitter.card' => 'summary_large_image']);
});

test('model with HasSeo trait has seo relationship', function () {
    $category = Category::factory()->create();

    expect($category->seo())->toBeInstanceOf(\Illuminate\Database\Eloquent\Relations\MorphOne::class);
});

test('can update SEO data for model', function () {
    $category = Category::factory()->create([
        'name' => 'Test Category',
        'slug' => 'test-category',
    ]);

    $category->updateSeo([
        'title'       => 'SEO Title',
        'description' => 'SEO Description',
        'robots'      => 'noindex,nofollow',
    ]);

    $category->refresh();

    expect($category->seo)->not->toBeNull();
    expect($category->seo->title)->toBe('SEO Title');
    expect($category->seo->description)->toBe('SEO Description');
    expect($category->seo->robots)->toBe('noindex,nofollow');
});

test('updateSeo creates new record if not exists', function () {
    $category = Category::factory()->create();

    expect(Seo::count())->toBe(0);

    $category->updateSeo([
        'title' => 'New SEO Title',
    ]);

    expect(Seo::count())->toBe(1);
});

test('updateSeo updates existing record', function () {
    $category = Category::factory()->create();

    $category->updateSeo(['title' => 'First Title']);
    $category->updateSeo(['title' => 'Updated Title']);

    expect(Seo::count())->toBe(1);
    expect($category->fresh()->seo->title)->toBe('Updated Title');
});

test('getDynamicSEOData returns SEOData instance', function () {
    $category = Category::factory()->create([
        'name' => 'Test Category',
    ]);

    $seoData = $category->getDynamicSEOData();

    expect($seoData)->toBeInstanceOf(SEOData::class);
});

test('getDynamicSEOData uses seo model data when available', function () {
    $category = Category::factory()->create([
        'name' => 'Test Category',
    ]);

    $category->updateSeo([
        'title'       => 'SEO Title',
        'description' => 'SEO Description',
    ]);

    $category->refresh();
    $seoData = $category->getDynamicSEOData();

    expect($seoData->title)->toBe('SEO Title');
    expect($seoData->description)->toBe('SEO Description');
});

test('getDynamicSEOData falls back to defaults when model has no title attribute', function () {
    // Category model has 'name' not 'title', so it falls back to config defaults
    $category = Category::factory()->create([
        'name'        => 'Test Category',
        'description' => 'Category Description',
    ]);

    $seoData = $category->getDynamicSEOData();

    // Title falls back to config default since Category doesn't have 'title' attribute
    expect($seoData->title)->toBe(config('seo.title'));
    // Description uses the model's description attribute
    expect($seoData->description)->toBe('Category Description');
});

test('getCanonicalUrl returns url based on slug', function () {
    $category = Category::factory()->create([
        'slug' => 'test-category',
    ]);

    $canonicalUrl = $category->getCanonicalUrl();

    expect($canonicalUrl)->toContain('test-category');
});
