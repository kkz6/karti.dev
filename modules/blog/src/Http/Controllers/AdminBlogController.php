<?php

namespace Modules\Blog\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Blog\Models\Article;
use Modules\Blog\Models\Category;
use Modules\Blog\Models\Tag;
use Modules\Blog\Tables\Articles;
use Modules\Shared\Http\Controllers\BaseController;

class AdminBlogController extends BaseController
{
    /**
     * Display a listing of articles.
     */
    public function index(Request $request): Response
    {
        $categories = Category::all(['id', 'name', 'slug']);
        $tags = Tag::all(['id', 'name', 'slug']);

        return Inertia::render('blog::index', [
            'articles' => Articles::make(),
            'categories' => $categories,
            'tags' => $tags,
            'filters' => $request->only(['search', 'category', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new article.
     */
    public function create(): Response
    {
        $categories = Category::all(['id', 'name', 'slug']);
        $tags = Tag::all(['id', 'name', 'slug']);

        return Inertia::render('blog::create', [
            'categories' => $categories,
            'tags' => $tags,
        ]);
    }

    /**
     * Store a newly created article in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:articles,slug',
            'content' => 'required|string',
            'excerpt' => 'nullable|string|max:500',
            'category_id' => 'required|exists:categories,id',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
            'status' => 'required|in:draft,published,archived',
            'featured_image' => 'nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'published_at' => 'nullable|date',
        ]);

        $article = Article::create([
            ...$validated,
            'user_id' => Auth::id(),
            'published_at' => $validated['status'] === 'published'
                ? ($validated['published_at'] ?? now())
                : null,
        ]);

        if (!empty($validated['tags'])) {
            $article->tags()->sync($validated['tags']);
        }

        return redirect()
            ->route('admin.blog.index')
            ->with('success', 'Article created successfully.');
    }

    /**
     * Display the specified article.
     */
    public function show(Article $article): Response
    {
        $article->load(['category', 'tags', 'user', 'comments.user']);

        return Inertia::render('blog::show', [
            'article' => $article,
        ]);
    }

    /**
     * Show the form for editing the specified article.
     */
    public function edit(Article $article): Response
    {
        $article->load(['category', 'tags']);
        $categories = Category::all(['id', 'name', 'slug']);
        $tags = Tag::all(['id', 'name', 'slug']);

        return Inertia::render('blog::edit', [
            'article' => $article,
            'categories' => $categories,
            'tags' => $tags,
        ]);
    }

    /**
     * Update the specified article in storage.
     */
    public function update(Request $request, Article $article): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:articles,slug,' . $article->id,
            'content' => 'required|string',
            'excerpt' => 'nullable|string|max:500',
            'category_id' => 'required|exists:categories,id',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
            'status' => 'required|in:draft,published,archived',
            'featured_image' => 'nullable|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'published_at' => 'nullable|date',
        ]);

        $article->update([
            ...$validated,
            'published_at' => $validated['status'] === 'published'
                ? ($validated['published_at'] ?? $article->published_at ?? now())
                : null,
        ]);

        if (isset($validated['tags'])) {
            $article->tags()->sync($validated['tags']);
        }

        return redirect()
            ->route('admin.blog.index')
            ->with('success', 'Article updated successfully.');
    }

    /**
     * Remove the specified article from storage.
     */
    public function destroy(Article $article): RedirectResponse
    {
        $article->tags()->detach();
        $article->comments()->delete();
        $article->delete();

        return redirect()
            ->route('admin.blog.index')
            ->with('success', 'Article deleted successfully.');
    }

    /**
     * Bulk action for multiple articles.
     */
    public function bulkAction(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:delete,publish,draft,archive',
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:articles,id',
        ]);

        $articles = Article::whereIn('id', $validated['ids']);

        switch ($validated['action']) {
            case 'delete':
                foreach ($articles->get() as $article) {
                    $article->tags()->detach();
                    $article->comments()->delete();
                }
                $articles->delete();
                $message = 'Articles deleted successfully.';
                break;

            case 'publish':
                $articles->update([
                    'status' => 'published',
                    'published_at' => now(),
                ]);
                $message = 'Articles published successfully.';
                break;

            case 'draft':
                $articles->update([
                    'status' => 'draft',
                    'published_at' => null,
                ]);
                $message = 'Articles moved to draft successfully.';
                break;

            case 'archive':
                $articles->update(['status' => 'archived']);
                $message = 'Articles archived successfully.';
                break;
        }

        return redirect()
            ->route('admin.blog.index')
            ->with('success', $message);
    }
}
