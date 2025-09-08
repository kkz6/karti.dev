<?php

declare(strict_types=1);

namespace Modules\Blog\Services;

use Illuminate\Database\Eloquent\Collection;
use Modules\Blog\Interfaces\TagRepositoryInterface;
use Modules\Blog\Interfaces\TagServiceInterface;
use Modules\Blog\Models\Tag;
use Modules\Shared\Services\Base\Concretes\BaseService;

/**
 * @extends BaseService<Tag, TagRepositoryInterface>
 *
 * @property TagRepositoryInterface $repository
 */
class TagService extends BaseService implements TagServiceInterface
{
    public function __construct(
        private readonly TagRepositoryInterface $tagRepository
    ) {
        $this->setRepository($this->tagRepository);
    }

    public function findBySlug(string $slug): ?Tag
    {
        return $this->repository->findBySlug($slug);
    }

    public function getPopular(int $limit = 10): Collection
    {
        return $this->repository->getPopular($limit);
    }
}
