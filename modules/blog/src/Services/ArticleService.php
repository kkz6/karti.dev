<?php

declare(strict_types=1);

namespace Modules\Blog\Services;

use Illuminate\Database\Eloquent\Collection;
use Modules\Blog\Interfaces\ArticleRepositoryInterface;
use Modules\Blog\Interfaces\ArticleServiceInterface;
use Modules\Blog\Models\Article;
use Modules\Shared\Services\Base\Concretes\BaseService;

/**
 * @extends BaseService<Article, ArticleRepositoryInterface>
 *
 * @property ArticleRepositoryInterface $repository
 */
class ArticleService extends BaseService implements ArticleServiceInterface
{
    public function __construct(
        private readonly ArticleRepositoryInterface $articleRepository
    ) {
        $this->setRepository($this->articleRepository);
    }

    public function getPublished(): Collection
    {
        return $this->repository->getPublished();
    }

    public function getByCategory(int $categoryId): Collection
    {
        return $this->repository->getByCategory($categoryId);
    }

    public function getByStatus(string $status): Collection
    {
        return $this->repository->getByStatus($status);
    }

    public function getFeatured(): Collection
    {
        return $this->repository->getFeatured();
    }

    public function findBySlug(string $slug): ?Article
    {
        return $this->repository->findBySlug($slug);
    }

    public function publish(string|int $id): bool
    {
        return $this->update($id, [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    public function unpublish(string|int $id): bool
    {
        return $this->update($id, [
            'status' => 'draft',
            'published_at' => null,
        ]);
    }
}
