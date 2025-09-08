<?php

declare(strict_types=1);

namespace Modules\Blog\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Blog\Models\Category;
use Modules\Shared\Services\Base\Contracts\BaseServiceInterface;

interface CategoryServiceInterface extends BaseServiceInterface
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
}
