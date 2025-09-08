<?php

declare(strict_types=1);

namespace Modules\Photography\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Photography\Models\Photo;
use Modules\Shared\Repositories\Base\Contracts\QueryableRepositoryInterface;

/**
 * @extends QueryableRepositoryInterface<Photo>
 */
interface PhotoRepositoryInterface extends QueryableRepositoryInterface
{
    /**
     * Get photos by collection
     *
     * @return Collection<int, Photo>
     */
    public function getByCollection(int $collectionId): Collection;

    /**
     * Update photo sort order
     */
    public function updateSortOrder(array $photoIds): bool;

    /**
     * Update photo by model
     */
    public function updateByModel(Photo $photo, array $data): Photo;
}
