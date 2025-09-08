<?php

declare(strict_types=1);

namespace Modules\Blog\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Blog\Models\Article;
use Modules\Shared\Repositories\Base\Contracts\QueryableRepositoryInterface;

/**
 * @extends QueryableRepositoryInterface<Article>
 */
interface ArticleRepositoryInterface extends QueryableRepositoryInterface
{
    /**
     * Get published articles
     *
     * @return Collection<int, Article>
     */
    public function getPublished(): Collection;

    /**
     * Get articles by category
     *
     * @return Collection<int, Article>
     */
    public function getByCategory(int $categoryId): Collection;

    /**
     * Get articles by status
     *
     * @return Collection<int, Article>
     */
    public function getByStatus(string $status): Collection;

    /**
     * Get featured articles
     *
     * @return Collection<int, Article>
     */
    public function getFeatured(): Collection;

    /**
     * Find article by slug
     */
    public function findBySlug(string $slug): ?Article;

    /**
     * Update article by model
     */
    public function updateByModel(Article $article, array $data): Article;
}
