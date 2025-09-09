<?php

declare(strict_types=1);

namespace Modules\Photography\Interfaces;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Modules\Photography\DTO\PhotoData;
use Modules\Photography\Models\Photo;
use Modules\Shared\Services\Base\Contracts\BaseServiceInterface;

interface PhotoServiceInterface extends BaseServiceInterface
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
     * Create a new photo gallery
     */
    public function createPhoto(PhotoData $data): Photo;

    /**
     * Update a photo gallery
     */
    public function updatePhoto(Photo $photo, PhotoData $data): Photo;

    /**
     * Delete a photo gallery
     */
    public function deletePhoto(Photo $photo): bool;

    /**
     * Update photo sort order
     */
    public function updateSortOrder(array $photoIds): bool;
}