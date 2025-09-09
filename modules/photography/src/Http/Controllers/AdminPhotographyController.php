<?php

namespace Modules\Photography\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Blog\Interfaces\CategoryServiceInterface;
use Modules\Blog\Models\Category;
use Modules\Photography\DTO\PhotoCollectionData;
use Modules\Photography\Interfaces\PhotoCollectionServiceInterface;
use Modules\Photography\Models\PhotoCollection;
use Modules\Photography\Tables\PhotoCollections;
use Modules\Shared\Http\Controllers\BaseController;

class AdminPhotographyController extends BaseController
{
    public function __construct(
        private readonly PhotoCollectionServiceInterface $photoCollectionService,
        private readonly CategoryServiceInterface $categoryService,
    ) {}
    /**
     * Display a listing of photo collections.
     */
    public function index(Request $request): Response
    {
        $categories = Category::all(['id', 'name', 'slug']);

        return Inertia::render('photography::index', [
            'collections' => PhotoCollections::make(),
            'categories'  => $categories,
            'filters'     => $request->only(['search', 'category', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new photo collection.
     */
    public function create(): Response
    {
        $categories = Category::all(['id', 'name', 'slug']);

        return Inertia::render('photography::create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created photo collection in storage.
     */
    public function store(PhotoCollectionData $dto): RedirectResponse
    {

        // Extract cover image URL from MediaAsset array
        $coverImageUrl = null;
        if (!empty($dto->cover_image) && is_array($dto->cover_image)) {
            $coverImageUrl = $dto->cover_image[0]['url'] ?? null;
        }

        $collection = $this->photoCollectionService->create([
            ...$dto->toArray(),
            'cover_image' => $coverImageUrl,
            'published_at' => $dto->status === 'published'
                ? ($dto->published_at ?? now())
                : null,
        ]);

        if (!empty($dto->categories)) {
            $collection->categories()->sync($dto->categories);
        }

        return redirect()
            ->route('admin.photography.index')
            ->with('success', 'Photo collection created successfully.');
    }

    /**
     * Display the specified photo collection.
     */
    public function show(PhotoCollection $photoCollection): Response
    {
        $photoCollection->load(['categories', 'photos' => function ($query) {
            $query->ordered();
        }]);

        return Inertia::render('photography::show', [
            'collection' => $photoCollection,
        ]);
    }

    /**
     * Show the form for editing the specified photo collection.
     */
    public function edit(PhotoCollection $photoCollection): Response
    {
        $photoCollection->load(['categories', 'photos' => function ($query) {
            $query->ordered();
        }]);
        $categories = Category::all(['id', 'name', 'slug']);

        return Inertia::render('photography::edit', [
            'collection' => $photoCollection,
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified photo collection in storage.
     */
    public function update(PhotoCollectionData $dto, PhotoCollection $photoCollection): RedirectResponse
    {

        // Extract cover image URL from MediaAsset array
        $coverImageUrl = null;
        if (!empty($dto->cover_image) && is_array($dto->cover_image)) {
            $coverImageUrl = $dto->cover_image[0]['url'] ?? null;
        }

        $this->photoCollectionService->update($photoCollection->id, [
            ...$dto->toArray(),
            'cover_image' => $coverImageUrl,
            'published_at' => $dto->status === 'published'
                ? ($dto->published_at ?? $photoCollection->published_at ?? now())
                : null,
        ]);

        if (!empty($dto->categories)) {
            $photoCollection->categories()->sync($dto->categories);
        }

        return redirect()
            ->route('admin.photography.index')
            ->with('success', 'Photo collection updated successfully.');
    }

    /**
     * Remove the specified photo collection from storage.
     */
    public function destroy(PhotoCollection $photoCollection): RedirectResponse
    {
        $photoCollection->categories()->detach();
        $photoCollection->photos()->delete();
        $this->photoCollectionService->delete($photoCollection->id);

        return redirect()
            ->route('admin.photography.index')
            ->with('success', 'Photo collection deleted successfully.');
    }
}
