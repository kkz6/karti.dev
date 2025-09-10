<?php

namespace Modules\Blog\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Blog\DTO\TagData;
use Modules\Blog\Interfaces\TagServiceInterface;
use Modules\Blog\Models\Tag;
use Modules\Blog\Tables\Tags;
use Modules\Shared\Http\Controllers\BaseController;

class TagController extends BaseController
{
    public function __construct(
        private readonly TagServiceInterface $tagService,
    ) {}

    /**
     * Display a listing of tags.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('blog::tags/index', [
            'tags'    => Tags::make(),
            'filters' => $request->only(['search', 'name']),
        ]);
    }

    /**
     * Show the form for creating a new tag.
     */
    public function create(): Response
    {
        return Inertia::render('blog::tags/create');
    }

    /**
     * Store a newly created tag in storage.
     */
    public function store(TagData $dto): RedirectResponse
    {
        $this->tagService->create($dto->toArray());

        return redirect()
            ->route('admin.tags.index')
            ->with('success', 'Tag created successfully.');
    }

    /**
     * Show the form for editing the specified tag.
     */
    public function edit(string $tag): Response
    {
        $tagData = $this->tagService->findOrFail($tag);

        return Inertia::render('blog::tags/edit', [
            'tag' => $tagData,
        ]);
    }

    /**
     * Update the specified tag in storage.
     */
    public function update(TagData $dto, string $tag): RedirectResponse
    {
        $this->tagService->update($tag, $dto->toArray());

        return redirect()
            ->route('admin.tags.index')
            ->with('success', 'Tag updated successfully.');
    }

    /**
     * Remove the specified tag from storage.
     */
    public function destroy(string $tag): RedirectResponse
    {
        $tagData = $this->tagService->findOrFail($tag);

        $tagData->articles()->detach();

        $tagData->delete();

        return redirect()
            ->route('admin.tags.index')
            ->with('success', 'Tag deleted successfully.');
    }
}
