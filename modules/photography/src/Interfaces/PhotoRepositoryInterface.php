<?php

declare(strict_types=1);

namespace Modules\Photography\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Modules\Photography\Models\Photo;
use Modules\Shared\Repositories\Base\Contracts\QueryableRepositoryInterface;

/**
 * @extends QueryableRepositoryInterface<Photo>
 */
interface PhotoRepositoryInterface extends QueryableRepositoryInterface
{
    /**
     * Get paginated photos with filters
     */
    public function getPaginatedWithFilters(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Get published photos
     *
     * @return Collection<int, Photo>
     */
    public function getPublished(): Collection;

    /**
     * Get featured photos
     *
     * @return Collection<int, Photo>
     */
    public function getFeatured(): Collection;

    /**
     * Update photo sort order
     */
    public function updateSortOrder(array $photoIds): bool;

    /**
     * Update photo by model
     */
    public function updateByModel(Photo $photo, array $data): Photo;

    /**
     * Find photo by slug
     */
    public function findBySlug(string $slug): ?Photo;
}