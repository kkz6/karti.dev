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
                    'coverImage'  => $photo->cover_image,
                    'imageCount'  => $photo->image_count,
                    'categories'  => $photo->categories->pluck('name')->toArray(),
                ];
            })->toArray();

        // Get featured photos for the hero section
        $featuredPhotos = $this->photoService->getFeatured()
            ->take(5)
            ->map(function ($photo) {
                // Use the first image from gallery, or cover_image as fallback
                $imageUrl = null;
                $galleryImages = $photo->images;
                
                if ($galleryImages->isNotEmpty()) {
                    $imageUrl = $galleryImages->first()->getUrl();
                } elseif ($photo->cover_image) {
                    $imageUrl = $photo->cover_image->getUrl();
                }

                return [
                    'src' => $imageUrl,
                    'alt' => $photo->title.' - '.($photo->short_description ?? 'Photography'),
                ];
            })
            ->filter(function ($photo) {
                return ! empty($photo['src']);
            })
            ->values()
            ->toArray();

        return Inertia::render('frontend::photography', [
            'photos'         => $photos,
            'featuredPhotos' => $featuredPhotos,
        ]);
    }

    public function show($slug): Response
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
        $coverImageUrl = $photo->cover_image ? $photo->cover_image->getUrl() : '';

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
