<?php

declare(strict_types=1);

namespace Modules\Blog\Services;

use Illuminate\Database\Eloquent\Collection;
use Modules\Blog\Interfaces\CategoryRepositoryInterface;
use Modules\Blog\Interfaces\CategoryServiceInterface;
use Modules\Blog\Models\Category;
use Modules\Shared\Services\Base\Concretes\BaseService;

/**
 * @extends BaseService<Category, CategoryRepositoryInterface>
 *
 * @property CategoryRepositoryInterface $repository
 */
class CategoryService extends BaseService implements CategoryServiceInterface
{
    public function __construct(
        private readonly CategoryRepositoryInterface $categoryRepository
    ) {
        $this->setRepository($this->categoryRepository);
    }

    public function getActive(): Collection
    {
        return $this->repository->getActive();
    }

    public function getWithArticleCount(): Collection
    {
        return $this->repository->getWithArticleCount();
    }

    public function findBySlug(string $slug): ?Category
    {
        return $this->repository->findBySlug($slug);
    }
}
