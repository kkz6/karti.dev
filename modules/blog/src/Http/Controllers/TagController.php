<?php

namespace Modules\Blog\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
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
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255|unique:tags,name',
            'slug'             => 'required|string|max:255|unique:tags,slug',
            'description'      => 'nullable|string|max:500',
            'meta_title'       => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
        ]);

        Tag::create($validated);

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
    public function update(Request $request, Tag $tag): RedirectResponse
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255|unique:tags,name,' . $tag->id,
            'slug'             => 'required|string|max:255|unique:tags,slug,' . $tag->id,
            'description'      => 'nullable|string|max:500',
            'meta_title'       => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
        ]);

        $tag->update($validated);

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
        $tag->delete();

        return redirect()
            ->route('admin.tags.index')
            ->with('success', 'Tag deleted successfully.');
    }
}
