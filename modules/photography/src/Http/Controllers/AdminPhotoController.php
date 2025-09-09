<?php

namespace Modules\Photography\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Photography\DTO\PhotoData;
use Modules\Photography\DTO\SortOrderData;
use Modules\Photography\Interfaces\PhotoServiceInterface;
use Modules\Photography\Models\Photo;
use Modules\Photography\Models\PhotoCollection;
use Modules\Photography\Tables\Photos;
use Modules\Shared\Http\Controllers\BaseController;

class AdminPhotoController extends BaseController
{
    public function __construct(
        private readonly PhotoServiceInterface $photoService,
    ) {}
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
    public function store(PhotoData $dto, PhotoCollection $photoCollection): RedirectResponse
    {

        // Extract image URL from MediaAsset array
        $imageUrl = null;
        if (!empty($dto->image_path) && is_array($dto->image_path)) {
            $imageUrl = $dto->image_path[0]['url'] ?? null;
        }

        if (!$imageUrl) {
            return redirect()->back()->withErrors(['image_path' => 'Please select an image.']);
        }

        $this->photoService->create([
            ...$dto->toArray(),
            'photo_collection_id' => $photoCollection->id,
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
    public function update(PhotoData $dto, PhotoCollection $photoCollection, Photo $photo): RedirectResponse
    {
        // Extract image URL from MediaAsset array
        $imageUrl = null;
        if (!empty($dto->image_path) && is_array($dto->image_path)) {
            $imageUrl = $dto->image_path[0]['url'] ?? null;
        }

        if (!$imageUrl) {
            return redirect()->back()->withErrors(['image_path' => 'Please select an image.']);
        }

        $this->photoService->update($photo->id, [
            ...$dto->toArray(),
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
        $this->photoService->delete($photo->id);

        return redirect()
            ->route('admin.photography.photos.index', $photoCollection)
            ->with('success', 'Photo deleted successfully.');
    }

    /**
     * Update the sort order of photos.
     */
    public function updateSortOrder(SortOrderData $dto, PhotoCollection $photoCollection): RedirectResponse
    {
        $photoIds = collect($dto->photos)->pluck('id')->toArray();
        $this->photoService->updateSortOrder($photoIds);

        return redirect()
            ->route('admin.photography.photos.index', $photoCollection)
            ->with('success', 'Photo order updated successfully.');
    }
}
