<?php

declare(strict_types=1);

namespace Modules\Photography\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Photography\Models\Photo;
use Modules\Shared\Services\Base\Contracts\BaseServiceInterface;

interface PhotoServiceInterface extends BaseServiceInterface
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
}
