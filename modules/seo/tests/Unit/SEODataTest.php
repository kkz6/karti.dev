<?php

use Modules\Seo\SchemaCollection;
use Modules\Seo\Support\SEOData;

test('can create SEOData with all fields', function () {
    $seoData = new SEOData(
        title: 'Test Title',
        description: 'Test Description',
        author: 'Test Author',
        image: '/images/test.jpg',
        canonical_url: 'https://example.com/test',
        robots: 'index,follow',
        type: 'article',
        locale: 'en_US',
        site_name: 'Test Site',
        twitter_card: 'summary_large_image',
        twitter_site: '@testsite',
        twitter_creator: '@testcreator',
        url: 'https://example.com/test',
    );

    expect($seoData->title)->toBe('Test Title');
    expect($seoData->description)->toBe('Test Description');
    expect($seoData->author)->toBe('Test Author');
    expect($seoData->image)->toBe('/images/test.jpg');
    expect($seoData->canonical_url)->toBe('https://example.com/test');
    expect($seoData->robots)->toBe('index,follow');
    expect($seoData->type)->toBe('article');
    expect($seoData->locale)->toBe('en_US');
    expect($seoData->site_name)->toBe('Test Site');
    expect($seoData->twitter_card)->toBe('summary_large_image');
    expect($seoData->twitter_site)->toBe('@testsite');
    expect($seoData->twitter_creator)->toBe('@testcreator');
    expect($seoData->url)->toBe('https://example.com/test');
});

test('SEOData has empty SchemaCollection by default', function () {
    $seoData = new SEOData(
        title: 'Test Title',
    );

    expect($seoData->schema)->toBeInstanceOf(SchemaCollection::class);
    expect($seoData->schema->toArray())->toBeEmpty();
});

test('can create SEOData with default values', function () {
    config(['seo.title' => 'Default Title']);
    config(['seo.description' => 'Default Description']);
    config(['seo.author' => 'Default Author']);
    config(['seo.image' => '/default.jpg']);
    config(['seo.robots' => 'index,follow']);
    config(['seo.type' => 'website']);
    config(['seo.locale' => 'en_US']);
    config(['seo.site_name' => 'Default Site']);
    config(['seo.twitter.card' => 'summary_large_image']);
    config(['seo.twitter.site' => '@defaultsite']);
    config(['seo.twitter.creator' => '@defaultcreator']);

    $seoData = SEOData::defaults();

    expect($seoData->title)->toBe('Default Title');
    expect($seoData->description)->toBe('Default Description');
    expect($seoData->author)->toBe('Default Author');
    expect($seoData->image)->toBe('/default.jpg');
    expect($seoData->robots)->toBe('index,follow');
    expect($seoData->type)->toBe('website');
    expect($seoData->site_name)->toBe('Default Site');
    expect($seoData->twitter_card)->toBe('summary_large_image');
    expect($seoData->twitter_site)->toBe('@defaultsite');
    expect($seoData->twitter_creator)->toBe('@defaultcreator');
});

test('SEOData can be converted to array', function () {
    $seoData = new SEOData(
        title: 'Test Title',
        description: 'Test Description',
        url: 'https://example.com/test',
    );

    $array = $seoData->toArray();

    expect($array)->toBeArray();
    expect($array['title'])->toBe('Test Title');
    expect($array['description'])->toBe('Test Description');
    expect($array['url'])->toBe('https://example.com/test');
});

test('SEOData handles null values correctly', function () {
    $seoData = new SEOData();

    expect($seoData->title)->toBeNull();
    expect($seoData->description)->toBeNull();
    expect($seoData->author)->toBeNull();
    expect($seoData->image)->toBeNull();
    expect($seoData->url)->toBeNull();
});
