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

        return Inertia::render('photography::create', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created photo gallery in storage.
     */
    public function store(PhotoData $dto): RedirectResponse
    {
        $photo = $this->photoService->createPhoto($dto);

        return redirect()
            ->route('admin.photography.edit', $photo)
            ->with('success', 'Photo gallery created successfully.');
    }

    /**
     * Show the form for editing the specified photo gallery.
     */
    public function edit(string $photo): Response
    {
        $photo = $this->photoService->findOrFail($photo);

        $photo->load('categories');
        $categories = $this->categoryService->all(['id', 'name']);

        return Inertia::render('photography::edit', [
            'photo'      => $photo->toArray(),
            'categories' => $categories,
        ]);
    }

    /**
     * Update the specified photo gallery in storage.
     */
    public function update(PhotoData $dto, Photo $photo): RedirectResponse
    {
        $this->photoService->updatePhoto($photo, $dto);

        return redirect()
            ->route('admin.photography.edit', $photo)
            ->with('success', 'Photo gallery updated successfully.');
    }

    /**
     * Remove the specified photo gallery from storage.
     */
    public function destroy(Photo $photo): RedirectResponse
    {
        $this->photoService->deletePhoto($photo);

        return redirect()
            ->route('admin.photography.index')
            ->with('success', 'Photo gallery deleted successfully.');
    }
}
