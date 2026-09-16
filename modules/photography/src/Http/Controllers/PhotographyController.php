<?php

namespace Modules\Photography\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Blog\Interfaces\CategoryServiceInterface;
use Modules\Photography\DTO\PhotoData;
use Modules\Photography\Interfaces\PhotoServiceInterface;
use Modules\Photography\Models\Photo;
use Modules\Photography\Tables\Photos;
use Modules\Shared\Http\Controllers\BaseController;

class PhotographyController extends BaseController
{
    public function __construct(
        private readonly PhotoServiceInterface $photoService,
        private readonly CategoryServiceInterface $categoryService,
    ) {}

    /**
     * Display a listing of photo galleries.
     */
    public function index(Request $request): Response
    {
        $categories = $this->categoryService->all(['id', 'name']);

        return Inertia::render('photography::index', [
            'photos'      => Photos::make(),
            'categories'  => $categories,
            'filters'     => $request->only(['search', 'category', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new photo gallery.
     */
    public function create(): Response
    {
        $categories = $this->categoryService->all(['id', 'name']);

        return Inertia::render('photography::createOrEdit', [
            'categories' => $categories,
        ]);
    }

    /**
     * Display the specified photo gallery.
     */
    public function show(Photo $photography): Response
    {
        $photography->load(['categories', 'media']);

        return Inertia::render('photography::show', [
            'collection' => [
                'id'               => $photography->id,
                'title'            => $photography->title,
                'slug'             => $photography->slug,
                'description'      => $photography->description,
                'status'           => $photography->status,
                'featured'         => $photography->featured,
                'sort_order'       => $photography->sort_order,
                'published_at'     => $photography->published_at?->toISOString(),
                'created_at'       => $photography->created_at?->toISOString(),
                'updated_at'       => $photography->updated_at?->toISOString(),
                'meta_title'       => $photography->meta_title,
                'meta_description' => $photography->meta_description,
                'categories'       => $photography->categories->map(fn ($category) => [
                    'id'   => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                ])->values(),
                'cover_image'      => $photography->cover_image?->getUrl(),
                'photos'           => $photography->images->map(fn ($image) => [
                    'id'         => $image->id,
                    'title'      => $image->title,
                    'image_path' => $image->getUrl(),
                    'alt_text'   => $image->alt,
                    'sort_order' => $image->pivot?->order ?? 0,
                    'width'      => null,
                    'height'     => null,
                    'file_size'  => $image->size,
                ])->values(),
            ],
        ]);
    }

    /**
     * Store a newly created photo gallery in storage.
     */
    public function store(PhotoData $dto): RedirectResponse
    {
        $photo = $this->photoService->createPhoto($dto);

        return redirect()
            ->route('admin.photography.edit', $photo->slug);
    }

    /**
     * Show the form for editing the specified photo gallery.
     */
    public function edit(Photo $photography): Response
    {
        $photography->load(['categories', 'media']);

        $categories = $this->categoryService->all(['id', 'name']);

        // Get cover image ID
        $coverImageId = $photography->cover_image?->id;

        // Get gallery image IDs
        $imageIds = $photography->images->pluck('id')->toArray();

        return Inertia::render('photography::createOrEdit', [
            'photo'      => array_merge($photography->toArray(), [
                'cover_image' => $coverImageId,
                'image_ids'   => $imageIds,
            ]),
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified photo gallery in storage.
     */
    public function update(PhotoData $dto, Photo $photography): RedirectResponse
    {
        $this->photoService->updatePhoto($photography, $dto);

        return redirect()
            ->route('admin.photography.edit', $photography->slug)
            ->with('success', 'Photo gallery updated successfully.');
    }

    /**
     * Remove the specified photo gallery from storage.
     */
    public function destroy(Photo $photography): RedirectResponse
    {
        $this->photoService->deletePhoto($photography);

        return redirect()
            ->route('admin.photography.index')
            ->with('success', 'Photo gallery deleted successfully.');
    }
}
