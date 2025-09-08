<?php

declare(strict_types=1);

namespace Modules\Blog\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Blog\Interfaces\ArticleRepositoryInterface;
use Modules\Blog\Models\Article;
use Modules\Shared\Repositories\Base\Concretes\QueryableRepository;

/**
 * @extends QueryableRepository<Article>
 */
class ArticleRepository extends QueryableRepository implements ArticleRepositoryInterface
{
    public function getModelClass(): string
    {
        return Article::class;
    }

    public function getPublished(): Collection
    {
        return $this->model->newQuery()
            ->published()
            ->with(['category', 'tags'])
            ->latest('published_at')
            ->get();
    }

    public function getByCategory(int $categoryId): Collection
    {
        return $this->model->newQuery()
            ->where('category_id', $categoryId)
            ->with(['category', 'tags'])
            ->latest('published_at')
            ->get();
    }

    public function getByStatus(string $status): Collection
    {
        return $this->model->newQuery()
            ->where('status', $status)
            ->with(['category', 'tags'])
            ->latest('created_at')
            ->get();
    }

    public function getFeatured(): Collection
    {
        return $this->model->newQuery()
            ->whereNotNull('featured_image')
            ->published()
            ->with(['category', 'tags'])
            ->latest('published_at')
            ->get();
    }

    public function findBySlug(string $slug): ?Article
    {
        return $this->model->newQuery()
            ->where('slug', $slug)
            ->with(['category', 'tags', 'user'])
            ->first();
    }

    public function updateByModel(Article $article, array $data): Article
    {
        $article->update($data);

        return $article->fresh(['category', 'tags']);
    }
}
