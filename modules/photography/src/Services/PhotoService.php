<?php

declare(strict_types=1);

namespace Modules\Photography\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Photography\DTO\PhotoData;
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

    public function getPaginatedWithFilters(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->getPaginatedWithFilters($filters, $perPage);
    }

    public function getPublished(): Collection
    {
        return $this->repository->getPublished();
    }

    public function getFeatured(): Collection
    {
        return $this->repository->getFeatured();
    }

    public function createPhoto(PhotoData $data): Photo
    {
        return DB::transaction(function () use ($data) {
            $photoData = [
                'title'        => $data->title,
                'slug'         => $data->slug,
                'description'  => $data->description,
                'status'       => $data->status,
                'featured'     => $data->featured,
                'sort_order'   => $data->sort_order,
                'published_at' => $data->published_at,
            ];

            $photo = $this->repository->create($photoData);

            if ($data->categories) {
                $photo->categories()->sync($data->categories);
            }

            if ($data->image_ids) {
                $photo->attachMedia($data->image_ids, 'gallery');
            }

            if ($data->cover_image) {
                $photo->attachMedia([$data->cover_image], 'cover');
            }

            return $photo;
        });
    }

    public function updatePhoto(Photo $photo, PhotoData $data): Photo
    {
        return DB::transaction(function () use ($photo, $data) {
            $photoData = [
                'title'        => $data->title,
                'slug'         => $data->slug,
                'description'  => $data->description,
                'status'       => $data->status,
                'featured'     => $data->featured,
                'sort_order'   => $data->sort_order,
                'published_at' => $data->published_at,
            ];

            $photo = $this->repository->updateByModel($photo, $photoData);

            if ($data->categories !== null) {
                $photo->categories()->sync($data->categories);
            }

            if ($data->image_ids !== null) {
                $photo->syncMedia($data->image_ids, 'gallery');
            }

            if ($data->cover_image !== null) {
                $photo->syncMedia($data->cover_image ? [$data->cover_image] : [], 'cover');
            }

            return $photo->fresh(['categories']);
        });
    }

    public function deletePhoto(Photo $photo): bool
    {
        return DB::transaction(function () use ($photo) {
            $photo->categories()->detach();
            return $this->repository->delete($photo->id);
        });
    }

    public function updateSortOrder(array $photoIds): bool
    {
        return $this->repository->updateSortOrder($photoIds);
    }
}
