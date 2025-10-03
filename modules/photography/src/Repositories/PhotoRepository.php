<?php

declare(strict_types=1);

namespace Modules\Photography\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
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

    public function getPaginatedWithFilters(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->newQuery();

        // Apply search filter
        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('title', 'like', '%'.$filters['search'].'%')
                    ->orWhere('description', 'like', '%'.$filters['search'].'%');
            });
        }

        // Apply status filter
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        // Apply category filter
        if (! empty($filters['category'])) {
            $query->whereHas('categories', function ($q) use ($filters) {
                $q->where('categories.id', $filters['category']);
            });
        }

        // Apply featured filter
        if (isset($filters['featured'])) {
            $query->where('featured', $filters['featured']);
        }

        return $query->with('categories')
            ->ordered()
            ->paginate($perPage);
    }

    public function getPublished(): Collection
    {
        return $this->model->newQuery()
            ->published()
            ->ordered()
            ->get();
    }

    public function getFeatured(): Collection
    {
        return $this->model->newQuery()
            ->featured()
            ->published()
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

        return $photo->fresh(['categories']) ?? $photo->load('categories');
    }

    public function findBySlug(string $slug): ?Photo
    {
        return $this->model->newQuery()
            ->where('slug', $slug)
            ->with('categories')
            ->first();
    }
}
