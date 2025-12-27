<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default SEO Settings
    |--------------------------------------------------------------------------
    |
    | These are the default SEO settings that will be used when no specific
    | SEO data is provided for a page or model.
    |
    */

    'title' => env('SEO_TITLE', config('app.name')),
    'description' => env('SEO_DESCRIPTION', 'Software developer and speaker based in Bangalore, India. Building technologies that empower people to explore the world on their own terms.'),
    'author' => env('SEO_AUTHOR', 'Karthick'),
    'image' => env('SEO_IMAGE', '/images/default-og-image.jpg'),
    'robots' => env('SEO_ROBOTS', 'index,follow'),
    'type' => env('SEO_TYPE', 'website'),
    'locale' => env('SEO_LOCALE', 'en_US'),
    'site_name' => env('SEO_SITE_NAME', config('app.name')),

    /*
    |--------------------------------------------------------------------------
    | Twitter Settings
    |--------------------------------------------------------------------------
    |
    | Configure Twitter Card settings for social media sharing.
    |
    */

    'twitter' => [
        'card' => env('TWITTER_CARD', 'summary_large_image'),
        'site' => env('TWITTER_SITE'),
        'creator' => env('TWITTER_CREATOR'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Schema.org Settings
    |--------------------------------------------------------------------------
    |
    | Default settings for structured data generation.
    |
    */

    'schema' => [
        'organization' => [
            'name' => config('app.name'),
            'url' => config('app.url'),
            'logo' => env('SCHEMA_LOGO', '/logo.svg'),
        ],
    ],
];
