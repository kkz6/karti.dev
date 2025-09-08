<?php

declare(strict_types=1);

namespace Modules\Photography\Services;

use Illuminate\Database\Eloquent\Collection;
use Modules\Photography\Interfaces\PhotoRepositoryInterface;
use Modules\Photography\Interfaces\PhotoServiceInterface;
use Modules\Photography\Models\Photo;
use Modules\Shared\Services\Base\Concretes\BaseService;

/**
 * @extends BaseService<Photo, PhotoRepositoryInterface>
 *
 * @property PhotoRepositoryInterface $repository
 */
class PhotoService extends BaseService implements PhotoServiceInterface
{
    public function __construct(
        private readonly PhotoRepositoryInterface $photoRepository
    ) {
        $this->setRepository($this->photoRepository);
    }

    public function getByCollection(int $collectionId): Collection
    {
        return $this->repository->getByCollection($collectionId);
    }

    public function updateSortOrder(array $photoIds): bool
    {
        return $this->repository->updateSortOrder($photoIds);
    }
}
