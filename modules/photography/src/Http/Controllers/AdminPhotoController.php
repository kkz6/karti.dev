<?php

namespace Modules\Photography\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Photography\Models\Photo;
use Modules\Photography\Models\PhotoCollection;
use Modules\Photography\Tables\Photos;
use Modules\Shared\Http\Controllers\BaseController;

class AdminPhotoController extends BaseController
{
    /**
     * Display a listing of photos.
     */
    public function index(Request $request, PhotoCollection $photoCollection): Response
    {
        return Inertia::render('photography::photos/index', [
            'collection' => $photoCollection,
            'photos'     => Photos::make()->setCollectionId($photoCollection->id),
            'filters'    => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new photo.
     */
    public function create(PhotoCollection $photoCollection): Response
    {
        return Inertia::render('photography::photos/create', [
            'collection' => $photoCollection,
        ]);
    }

    /**
     * Store a newly created photo in storage.
     */
    public function store(Request $request, PhotoCollection $photoCollection): RedirectResponse
    {
        $validated = $request->validate([
            'title'       => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image_path'  => 'required|array',
            'alt_text'    => 'nullable|string|max:255',
            'sort_order'  => 'nullable|integer|min:0',
            'width'       => 'nullable|integer|min:1',
            'height'      => 'nullable|integer|min:1',
            'file_size'   => 'nullable|integer|min:0',
            'exif_data'   => 'nullable|array',
        ]);

        // Extract image URL from MediaAsset array
        $imageUrl = null;
        if (!empty($validated['image_path']) && is_array($validated['image_path'])) {
            $imageUrl = $validated['image_path'][0]['url'] ?? null;
        }

        if (!$imageUrl) {
            return redirect()->back()->withErrors(['image_path' => 'Please select an image.']);
        }

        $photoCollection->photos()->create([
            ...$validated,
            'image_path' => $imageUrl,
        ]);

        return redirect()
            ->route('admin.photography.photos.index', $photoCollection)
            ->with('success', 'Photo added successfully.');
    }

    /**
     * Display the specified photo.
     */
    public function show(PhotoCollection $photoCollection, Photo $photo): Response
    {
        return Inertia::render('photography::photos/show', [
            'collection' => $photoCollection,
            'photo'      => $photo,
        ]);
    }

    /**
     * Show the form for editing the specified photo.
     */
    public function edit(PhotoCollection $photoCollection, Photo $photo): Response
    {
        return Inertia::render('photography::photos/edit', [
            'collection' => $photoCollection,
            'photo'      => $photo,
        ]);
    }

    /**
     * Update the specified photo in storage.
     */
    public function update(Request $request, PhotoCollection $photoCollection, Photo $photo): RedirectResponse
    {
        $validated = $request->validate([
            'title'       => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'image_path'  => 'required|array',
            'alt_text'    => 'nullable|string|max:255',
            'sort_order'  => 'nullable|integer|min:0',
            'width'       => 'nullable|integer|min:1',
            'height'      => 'nullable|integer|min:1',
            'file_size'   => 'nullable|integer|min:0',
            'exif_data'   => 'nullable|array',
        ]);

        // Extract image URL from MediaAsset array
        $imageUrl = null;
        if (!empty($validated['image_path']) && is_array($validated['image_path'])) {
            $imageUrl = $validated['image_path'][0]['url'] ?? null;
        }

        if (!$imageUrl) {
            return redirect()->back()->withErrors(['image_path' => 'Please select an image.']);
        }

        $photo->update([
            ...$validated,
            'image_path' => $imageUrl,
        ]);

        return redirect()
            ->route('admin.photography.photos.index', $photoCollection)
            ->with('success', 'Photo updated successfully.');
    }

    /**
     * Remove the specified photo from storage.
     */
    public function destroy(PhotoCollection $photoCollection, Photo $photo): RedirectResponse
    {
        $photo->delete();

        return redirect()
            ->route('admin.photography.photos.index', $photoCollection)
            ->with('success', 'Photo deleted successfully.');
    }

    /**
     * Update the sort order of photos.
     */
    public function updateSortOrder(Request $request, PhotoCollection $photoCollection): RedirectResponse
    {
        $validated = $request->validate([
            'photos'            => 'required|array',
            'photos.*.id'       => 'required|exists:photos,id',
            'photos.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($validated['photos'] as $photoData) {
            Photo::where('id', $photoData['id'])
                ->where('photo_collection_id', $photoCollection->id)
                ->update(['sort_order' => $photoData['sort_order']]);
        }

        return redirect()
            ->route('admin.photography.photos.index', $photoCollection)
            ->with('success', 'Photo order updated successfully.');
    }
}
