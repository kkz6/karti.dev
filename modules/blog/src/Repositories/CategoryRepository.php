<?php

declare(strict_types=1);

namespace Modules\Blog\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Blog\Interfaces\CategoryRepositoryInterface;
use Modules\Blog\Models\Category;
use Modules\Shared\Repositories\Base\Concretes\QueryableRepository;

/**
 * @extends QueryableRepository<Category>
 */
class CategoryRepository extends QueryableRepository implements CategoryRepositoryInterface
{
    public function getModelClass(): string
    {
        return Category::class;
    }

    public function getActive(): Collection
    {
        return $this->model->newQuery()
            ->active()
            ->ordered()
            ->get();
    }

    public function getWithArticleCount(): Collection
    {
        return $this->model->newQuery()
            ->withCount('articles')
            ->ordered()
            ->get();
    }

    public function findBySlug(string $slug): ?Category
    {
        return $this->model->newQuery()
            ->where('slug', $slug)
            ->first();
    }

    public function updateByModel(Category $category, array $data): Category
    {
        $category->update($data);

        return $category->fresh();
    }
}
