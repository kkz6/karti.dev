<?php

declare(strict_types=1);

namespace Modules\Blog\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Blog\Models\Article;
use Modules\Shared\Services\Base\Contracts\BaseServiceInterface;

interface ArticleServiceInterface extends BaseServiceInterface
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
     * Publish article
     */
    public function publish(string|int $id): bool;

    /**
     * Unpublish article
     */
    public function unpublish(string|int $id): bool;
}
