<?php

namespace Modules\Frontend\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Photography\Interfaces\PhotoServiceInterface;
use Modules\Shared\Http\Controllers\BaseController;

class PhotographyController extends BaseController
{
    public function __construct(
        private readonly PhotoServiceInterface $photoService
    ) {}

    public function index(): Response
    {
        $photos = $this->photoService->getPublished()
            ->map(function ($photo) {
                return [
                    'slug'        => $photo->slug,
                    'title'       => $photo->title,
                    'description' => $photo->description,
                    'date'        => $photo->published_at ? $photo->published_at->format('Y-m-d') : null,
                    'coverImage'  => $photo->cover_image?->getUrl(),
                    'imageCount'  => $photo->images->count(),
                    'categories'  => $photo->categories->pluck('name')->toArray(),
                ];
            })->toArray();

        return Inertia::render('frontend::photography', [
            'photos'         => $photos,
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
        $images = $photo->images->map(function($media) {
            return [
                'card_url' => $media->getConversion('card') ?: $media->getUrl(),
                'full_url' => $media->getUrl(),
                'alt' => $media->alt ?: 'Gallery image',
            ];
        })->toArray();
        
        // Get cover image URL if available
        $coverImageUrl = $photo->cover_image?->getUrl() ?? '';

        return Inertia::render('frontend::photography/show', [
            'photo' => [
                'slug'        => $photo->slug,
                'title'       => $photo->title,
                'description' => $photo->description,
                'date'        => $photo->published_at ? $photo->published_at->format('Y-m-d') : null,
                'categories'  => $photo->categories,
                'cover_image' => $coverImageUrl,
                'images'      => $images,
                'image_count' => count($images),
            ],
        ]);
    }
}
