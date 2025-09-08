<?php

namespace Modules\Photography\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Blog\Interfaces\CategoryServiceInterface;
use Modules\Blog\Models\Category;
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
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'slug'             => 'required|string|max:255|unique:photo_collections,slug',
            'description'      => 'nullable|string',
            'cover_image'      => 'nullable|array',
            'categories'       => 'nullable|array',
            'categories.*'     => 'exists:categories,id',
            'status'           => 'required|in:draft,published,archived',
            'featured'         => 'boolean',
            'sort_order'       => 'nullable|integer|min:0',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'published_at'     => 'nullable|date',
        ]);

        // Extract cover image URL from MediaAsset array
        $coverImageUrl = null;
        if (!empty($validated['cover_image']) && is_array($validated['cover_image'])) {
            $coverImageUrl = $validated['cover_image'][0]['url'] ?? null;
        }

        $collection = PhotoCollection::create([
            ...$validated,
            'cover_image' => $coverImageUrl,
            'published_at' => $validated['status'] === 'published'
                ? ($validated['published_at'] ?? now())
                : null,
        ]);

        if (! empty($validated['categories'])) {
            $collection->categories()->sync($validated['categories']);
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
    public function update(Request $request, PhotoCollection $photoCollection): RedirectResponse
    {
        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'slug'             => 'required|string|max:255|unique:photo_collections,slug,' . $photoCollection->id,
            'description'      => 'nullable|string',
            'cover_image'      => 'nullable|array',
            'categories'       => 'nullable|array',
            'categories.*'     => 'exists:categories,id',
            'status'           => 'required|in:draft,published,archived',
            'featured'         => 'boolean',
            'sort_order'       => 'nullable|integer|min:0',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'published_at'     => 'nullable|date',
        ]);

        // Extract cover image URL from MediaAsset array
        $coverImageUrl = null;
        if (!empty($validated['cover_image']) && is_array($validated['cover_image'])) {
            $coverImageUrl = $validated['cover_image'][0]['url'] ?? null;
        }

        $photoCollection->update([
            ...$validated,
            'cover_image' => $coverImageUrl,
            'published_at' => $validated['status'] === 'published'
                ? ($validated['published_at'] ?? $photoCollection->published_at ?? now())
                : null,
        ]);

        if (isset($validated['categories'])) {
            $photoCollection->categories()->sync($validated['categories']);
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
        $photoCollection->delete();

        return redirect()
            ->route('admin.photography.index')
            ->with('success', 'Photo collection deleted successfully.');
    }
}
