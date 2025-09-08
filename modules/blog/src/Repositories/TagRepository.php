<?php

declare(strict_types=1);

namespace Modules\Blog\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Blog\Interfaces\TagRepositoryInterface;
use Modules\Blog\Models\Tag;
use Modules\Shared\Repositories\Base\Concretes\QueryableRepository;

/**
 * @extends QueryableRepository<Tag>
 */
class TagRepository extends QueryableRepository implements TagRepositoryInterface
{
    public function getModelClass(): string
    {
        return Tag::class;
    }

    public function findBySlug(string $slug): ?Tag
    {
        return $this->model->newQuery()
            ->where('slug', $slug)
            ->first();
    }

    public function getPopular(int $limit = 10): Collection
    {
        return $this->model->newQuery()
            ->withCount('articles')
            ->orderBy('articles_count', 'desc')
            ->limit($limit)
            ->get();
    }

    public function updateByModel(Tag $tag, array $data): Tag
    {
        $tag->update($data);

        return $tag->fresh();
    }
}
