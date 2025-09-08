<?php

declare(strict_types=1);

namespace Modules\Photography\Services;

use Illuminate\Database\Eloquent\Collection;
use Modules\Photography\Interfaces\PhotoCollectionRepositoryInterface;
use Modules\Photography\Interfaces\PhotoCollectionServiceInterface;
use Modules\Photography\Models\PhotoCollection;
use Modules\Shared\Services\Base\Concretes\BaseService;

/**
 * @extends BaseService<PhotoCollection, PhotoCollectionRepositoryInterface>
 *
 * @property PhotoCollectionRepositoryInterface $repository
 */
class PhotoCollectionService extends BaseService implements PhotoCollectionServiceInterface
{
    public function __construct(
        private readonly PhotoCollectionRepositoryInterface $photoCollectionRepository
    ) {
        $this->setRepository($this->photoCollectionRepository);
    }

    public function getPublished(): Collection
    {
        return $this->repository->getPublished();
    }

    public function getFeatured(): Collection
    {
        return $this->repository->getFeatured();
    }

    public function findBySlug(string $slug): ?PhotoCollection
    {
        return $this->repository->findBySlug($slug);
    }

    public function getWithPhotoCount(): Collection
    {
        return $this->repository->getWithPhotoCount();
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
