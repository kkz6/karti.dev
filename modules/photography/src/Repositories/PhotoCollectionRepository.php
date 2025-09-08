<?php

declare(strict_types=1);

namespace Modules\Photography\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Photography\Interfaces\PhotoCollectionRepositoryInterface;
use Modules\Photography\Models\PhotoCollection;
use Modules\Shared\Repositories\Base\Concretes\QueryableRepository;

/**
 * @extends QueryableRepository<PhotoCollection>
 */
class PhotoCollectionRepository extends QueryableRepository implements PhotoCollectionRepositoryInterface
{
    public function getModelClass(): string
    {
        return PhotoCollection::class;
    }

    public function getPublished(): Collection
    {
        return $this->model->newQuery()
            ->published()
            ->ordered()
            ->with(['categories'])
            ->get();
    }

    public function getFeatured(): Collection
    {
        return $this->model->newQuery()
            ->featured()
            ->published()
            ->ordered()
            ->with(['categories'])
            ->get();
    }

    public function findBySlug(string $slug): ?PhotoCollection
    {
        return $this->model->newQuery()
            ->where('slug', $slug)
            ->with(['categories', 'photos' => function ($query) {
                $query->ordered();
            }])
            ->first();
    }

    public function getWithPhotoCount(): Collection
    {
        return $this->model->newQuery()
            ->withCount('photos')
            ->ordered()
            ->get();
    }

    public function updateByModel(PhotoCollection $collection, array $data): PhotoCollection
    {
        $collection->update($data);

        return $collection->fresh(['categories', 'photos']);
    }
}
