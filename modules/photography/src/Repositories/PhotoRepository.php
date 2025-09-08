<?php

declare(strict_types=1);

namespace Modules\Photography\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Photography\Interfaces\PhotoRepositoryInterface;
use Modules\Photography\Models\Photo;
use Modules\Shared\Repositories\Base\Concretes\QueryableRepository;

/**
 * @extends QueryableRepository<Photo>
 */
class PhotoRepository extends QueryableRepository implements PhotoRepositoryInterface
{
    public function getModelClass(): string
    {
        return Photo::class;
    }

    public function getByCollection(int $collectionId): Collection
    {
        return $this->model->newQuery()
            ->where('photo_collection_id', $collectionId)
            ->ordered()
            ->get();
    }

    public function updateSortOrder(array $photoIds): bool
    {
        foreach ($photoIds as $index => $photoId) {
            $this->model->newQuery()
                ->where('id', $photoId)
                ->update(['sort_order' => $index + 1]);
        }

        return true;
    }

    public function updateByModel(Photo $photo, array $data): Photo
    {
        $photo->update($data);

        return $photo->fresh(['collection']);
    }
}
