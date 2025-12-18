<?php

use Modules\Seo\SEOManager;
use Modules\Seo\Support\SEOData;
use Modules\Seo\Tags\TagCollection;

test('SEOManager generates tag collection', function () {
    $manager = app('seo-manager');

    $seoData = new SEOData(
        title: 'Test Page',
        description: 'Test Description',
    );

    $tags = $manager->generateTags($seoData);

    expect($tags)->toBeInstanceOf(TagCollection::class);
});

test('SEOManager generates title tag', function () {
    $manager = app('seo-manager');

    $seoData = new SEOData(
        title: 'My Page Title',
    );

    $tags = $manager->generateTags($seoData);
    $rendered = $tags->render();

    expect($rendered)->toContain('<title>My Page Title</title>');
});

test('SEOManager generates meta description tag', function () {
    $manager = app('seo-manager');

    $seoData = new SEOData(
        description: 'This is a test description',
    );

    $tags = $manager->generateTags($seoData);
    $rendered = $tags->render();

    expect($rendered)->toContain('name="description"');
    expect($rendered)->toContain('This is a test description');
});

test('SEOManager generates OpenGraph tags', function () {
    $manager = app('seo-manager');

    $seoData = new SEOData(
        title: 'OG Title',
        description: 'OG Description',
        image: 'https://example.com/image.jpg',
        url: 'https://example.com/page',
        type: 'article',
        site_name: 'Test Site',
    );

    $tags = $manager->generateTags($seoData);
    $rendered = $tags->render();

    expect($rendered)->toContain('property="og:title"');
    expect($rendered)->toContain('OG Title');
    expect($rendered)->toContain('property="og:description"');
    expect($rendered)->toContain('OG Description');
    expect($rendered)->toContain('property="og:image"');
    expect($rendered)->toContain('https://example.com/image.jpg');
    expect($rendered)->toContain('property="og:url"');
    expect($rendered)->toContain('https://example.com/page');
    expect($rendered)->toContain('property="og:type"');
    expect($rendered)->toContain('article');
    expect($rendered)->toContain('property="og:site_name"');
    expect($rendered)->toContain('Test Site');
});

test('SEOManager generates Twitter card tags', function () {
    $manager = app('seo-manager');

    $seoData = new SEOData(
        title: 'Twitter Title',
        description: 'Twitter Description',
        image: 'https://example.com/twitter.jpg',
        twitter_card: 'summary_large_image',
        twitter_site: '@mysite',
        twitter_creator: '@author',
    );

    $tags = $manager->generateTags($seoData);
    $rendered = $tags->render();

    // Twitter tags use property= in this implementation
    expect($rendered)->toContain('property="twitter:card"');
    expect($rendered)->toContain('summary_large_image');
    expect($rendered)->toContain('property="twitter:title"');
    expect($rendered)->toContain('Twitter Title');
    expect($rendered)->toContain('property="twitter:description"');
    expect($rendered)->toContain('Twitter Description');
    expect($rendered)->toContain('property="twitter:image"');
    expect($rendered)->toContain('https://example.com/twitter.jpg');
    expect($rendered)->toContain('property="twitter:site"');
    expect($rendered)->toContain('@mysite');
    expect($rendered)->toContain('property="twitter:creator"');
    expect($rendered)->toContain('@author');
});

test('SEOManager generates canonical link tag', function () {
    $manager = app('seo-manager');

    $seoData = new SEOData(
        url: 'https://example.com/canonical',
    );

    $tags = $manager->generateTags($seoData);
    $rendered = $tags->render();

    expect($rendered)->toContain('rel="canonical"');
    expect($rendered)->toContain('https://example.com/canonical');
});

test('SEOManager generates robots meta tag', function () {
    $manager = app('seo-manager');

    $seoData = new SEOData(
        robots: 'noindex,nofollow',
    );

    $tags = $manager->generateTags($seoData);
    $rendered = $tags->render();

    expect($rendered)->toContain('name="robots"');
    expect($rendered)->toContain('noindex,nofollow');
});

test('seo helper function works with SEOData', function () {
    $seoData = new SEOData(
        title: 'Helper Test',
        description: 'Testing the helper function',
    );

    $rendered = seo($seoData);

    expect($rendered)->toContain('Helper Test');
    expect($rendered)->toContain('Testing the helper function');
});

test('seo helper function uses defaults when called without arguments', function () {
    config(['seo.title' => 'Default Site Title']);
    config(['seo.description' => 'Default site description']);

    $rendered = seo();

    expect($rendered)->toContain('Default Site Title');
    expect($rendered)->toContain('Default site description');
});
