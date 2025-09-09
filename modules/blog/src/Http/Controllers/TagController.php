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
            'tags' => Tags::make(),
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
     * Display the specified tag.
     */
    public function show(Tag $tag): Response
    {
        $tag->load(['articles' => function ($query) {
            $query->with('user', 'category')->latest()->take(10);
        }]);

        return Inertia::render('blog::tags/show', [
            'tag' => $tag,
        ]);
    }

    /**
     * Show the form for editing the specified tag.
     */
    public function edit(Tag $tag): Response
    {
        return Inertia::render('blog::tags/edit', [
            'tag' => $tag,
        ]);
    }

    /**
     * Update the specified tag in storage.
     */
    public function update(TagData $dto, Tag $tag): RedirectResponse
    {
        $this->tagService->update($tag->id, $dto->toArray());

        return redirect()
            ->route('admin.tags.index')
            ->with('success', 'Tag updated successfully.');
    }

    /**
     * Remove the specified tag from storage.
     */
    public function destroy(Tag $tag): RedirectResponse
    {
        // Detach from articles before deleting
        $tag->articles()->detach();
        $this->tagService->delete($tag->id);

        return redirect()
            ->route('admin.tags.index')
            ->with('success', 'Tag deleted successfully.');
    }
}
