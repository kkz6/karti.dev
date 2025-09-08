<?php

declare(strict_types=1);

namespace Modules\Blog\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Blog\Models\Category;
use Modules\Shared\Repositories\Base\Contracts\QueryableRepositoryInterface;

/**
 * @extends QueryableRepositoryInterface<Category>
 */
interface CategoryRepositoryInterface extends QueryableRepositoryInterface
{
    /**
     * Get active categories
     *
     * @return Collection<int, Category>
     */
    public function getActive(): Collection;

    /**
     * Get categories with article count
     *
     * @return Collection<int, Category>
     */
    public function getWithArticleCount(): Collection;

    /**
     * Find category by slug
     */
    public function findBySlug(string $slug): ?Category;

    /**
     * Update category by model
     */
    public function updateByModel(Category $category, array $data): Category;
}
