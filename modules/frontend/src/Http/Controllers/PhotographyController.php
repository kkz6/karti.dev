<?php

namespace Modules\Frontend\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Photography\Interfaces\PhotoServiceInterface;
use Modules\Seo\Support\SEOData;
use Modules\Shared\Http\Controllers\BaseController;

class PhotographyController extends BaseController
{
    public function __construct(
        private readonly PhotoServiceInterface $photoService
    ) {}

    private function getSeoArray(SEOData $seoData): array
    {
        return [
            'title'           => $seoData->title,
            'description'     => $seoData->description,
            'author'          => $seoData->author,
            'image'           => $seoData->image ? url($seoData->image) : null,
            'url'             => $seoData->url,
            'type'            => $seoData->type,
            'site_name'       => $seoData->site_name,
            'twitter_card'    => $seoData->twitter_card,
            'twitter_site'    => $seoData->twitter_site,
            'twitter_creator' => $seoData->twitter_creator,
            'robots'          => $seoData->robots,
            'locale'          => $seoData->locale,
        ];
    }

    public function index(): Response
    {
        $photos = $this->photoService->getPublished()
            ->map(function ($photo) {
                return [
                    'slug'        => $photo->slug,
                    'title'       => $photo->title,
                    'description' => $photo->excerpt,
                    'date'        => $photo->published_at ? $photo->published_at->format('Y-m-d') : null,
                    'coverImage'  => $photo->cover_image?->getUrl(),
                    'imageCount'  => $photo->images->count(),
                    'categories'  => $photo->categories->pluck('name')->toArray(),
                    'location'    => null,
                ];
            })->toArray();

        $seoData = new SEOData(
            title: 'Photography - ' . config('seo.site_name', config('app.name')),
            description: 'A visual journal capturing moments through my lens. From landscapes to street scenes, each collection tells its own story.',
            author: config('seo.author', 'Karthick'),
            image: config('seo.image'),
            url: url('/photography'),
            type: 'website',
            site_name: config('seo.site_name', config('app.name')),
            twitter_card: config('seo.twitter.card', 'summary_large_image'),
            twitter_site: config('seo.twitter.site'),
            twitter_creator: config('seo.twitter.creator'),
            robots: config('seo.robots', 'index,follow'),
            locale: config('seo.locale', 'en_US'),
        );

        return Inertia::render('frontend::photography', [
            'photos' => $photos,
            'seo'    => $this->getSeoArray($seoData),
        ]);
    }

    public function show(string $slug): Response
    {
        $photo = $this->photoService->getPublished()
            ->where('slug', $slug)
            ->first();

        if (! $photo) {
            abort(404);
        }

        // Get image data with both card conversions and full URLs
        $images = $photo->images->map(function ($media) {
            return [
                'card_url' => $media->getConversion('card') ?: $media->getUrl(),
                'full_url' => $media->getUrl(),
                'alt'      => $media->alt ?: 'Gallery image',
            ];
        })->toArray();

        // Get cover image URL if available
        $coverImageUrl = $photo->cover_image?->getUrl() ?? '';
        $photoUrl      = url("/photography/{$photo->slug}");

        // Get SEO data from the photo model
        $seoData = $photo->getDynamicSEOData();

        $jsonLd = [
            '@context'      => 'https://schema.org',
            '@type'         => 'ImageGallery',
            'name'          => $seoData->title ?? $photo->title,
            'description'   => $seoData->description ?? $photo->excerpt,
            'image'         => $coverImageUrl ?: config('seo.image'),
            'url'           => $photoUrl,
            'datePublished' => $photo->published_at?->toISOString(),
            'dateModified'  => $photo->updated_at->toISOString(),
            'author'        => [
                '@type' => 'Person',
                'name'  => config('seo.author', 'Karthick'),
                'url'   => url('/'),
            ],
            'numberOfItems' => count($images),
        ];

        return Inertia::render('frontend::photography/show', [
            'photo'  => [
                'slug'        => $photo->slug,
                'title'       => $photo->title,
                'description' => $photo->description,
                'date'        => $photo->published_at ? $photo->published_at->format('Y-m-d') : null,
                'categories'  => $photo->categories,
                'cover_image' => $coverImageUrl,
                'images'      => $images,
                'image_count' => count($images),
            ],
            'seo'    => $this->getSeoArray($seoData),
            'jsonLd' => $jsonLd,
        ]);
    }
}
