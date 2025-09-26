<?php

namespace Modules\Blog\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Blog\DTO\ArticleData;
use Modules\Blog\Interfaces\ArticleServiceInterface;
use Modules\Blog\Interfaces\CategoryServiceInterface;
use Modules\Blog\Interfaces\TagServiceInterface;
use Modules\Blog\Models\Article;
use Modules\Blog\Models\Category;
use Modules\Blog\Models\Tag;
use Modules\Blog\Tables\Articles;
use Modules\Shared\Http\Controllers\BaseController;

class BlogController extends BaseController
{
    public function __construct(
        private readonly ArticleServiceInterface $articleService,
        private readonly CategoryServiceInterface $categoryService,
        private readonly TagServiceInterface $tagService,
    ) {}

    /**
     * Display a listing of articles.
     */
    public function index(Request $request): Response
    {
        $categories = Category::all(['id', 'name', 'slug']);
        $tags       = Tag::all(['id', 'name', 'slug']);

        return Inertia::render('blog::index', [
            'articles'   => Articles::make(),
            'categories' => $categories,
            'tags'       => $tags,
            'filters'    => $request->only(['search', 'category', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new article.
     */
    public function create(): Response
    {
        $categories = $this->categoryService->all(['id', 'name', 'slug']);
        $tags       = $this->tagService->all(['id', 'name', 'slug']);

        return Inertia::render('blog::create', [
            'categories' => $categories,
            'tags'       => $tags,
        ]);
    }

    /**
     * Store a newly created article in storage.
     */
    public function store(ArticleData $dto): RedirectResponse
    {

        // Process featured image from asset field
        $featuredImageData = $dto->featured_image ?? [];
        $featuredImageUrl  = null;

        if (! empty($featuredImageData) && is_array($featuredImageData)) {
            // Extract the URL from the first asset
            $firstAsset = $featuredImageData[0] ?? null;
            if ($firstAsset && isset($firstAsset['url'])) {
                $featuredImageUrl = $firstAsset['url'];
            }
        }

        $article = $this->articleService->create([
            ...$dto->toArray(),
            'featured_image' => $featuredImageUrl, // Store as URL string for backward compatibility
            'user_id'        => Auth::id(),
            'published_at'   => $dto->status === 'published'
                ? ($dto->published_at ?? now())
                : null,
        ]);

        if (! empty($dto->tags)) {
            $article->tags()->sync($dto->tags);
        }

        return redirect()
            ->route('admin.blog.index')
            ->with('success', 'Article created successfully.');
    }

    /**
     * Show the form for editing the specified article.
     *
     * @param mixed $article
     */
    public function edit(string $article): Response
    {
        // Handle both slug and ID for route model binding
        $article = $this->articleService->findOrFail($article);

        $categories = $this->categoryService->all(['id', 'name', 'slug']);
        $tags       = $this->tagService->all(['id', 'name', 'slug']);

        return Inertia::render('blog::edit', [
            'article'    => $article,
            'categories' => $categories,
            'tags'       => $tags,
        ]);
    }

    /**
     * Update the specified article in storage.
     */
    public function update(ArticleData $dto, string $article): RedirectResponse
    {

        // Process featured image from asset field
        $featuredImageData = $dto->featured_image ?? [];
        $featuredImageUrl  = null;

        if (! empty($featuredImageData) && is_array($featuredImageData)) {
            $firstAsset = $featuredImageData[0] ?? null;
            if ($firstAsset && isset($firstAsset['url'])) {
                $featuredImageUrl = $firstAsset['url'];
            }
        }

        $articleData = $this->articleService->findOrFail($article);

        $this->articleService->update($article, [
            ...$dto->except('tags', 'meta_title', 'meta_description', 'article_id')->toArray(),
            'featured_image' => $featuredImageUrl,
            'published_at'   => $dto->status === 'published'
                ? ($dto->published_at ?? $articleData->published_at ?? now())
                : null,
        ]);

        if (! empty($dto->tags)) {
            $articleData->tags()->sync($dto->tags);
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
        $this->articleService->delete($article->id);

        return redirect()
            ->route('admin.blog.index')
            ->with('success', 'Article deleted successfully.');
    }
}
