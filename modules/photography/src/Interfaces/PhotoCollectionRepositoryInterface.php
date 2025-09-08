<?php

declare(strict_types=1);

namespace Modules\Photography\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Photography\Models\PhotoCollection;
use Modules\Shared\Repositories\Base\Contracts\QueryableRepositoryInterface;

/**
 * @extends QueryableRepositoryInterface<PhotoCollection>
 */
interface PhotoCollectionRepositoryInterface extends QueryableRepositoryInterface
{
    /**
     * Get published collections
     *
     * @return Collection<int, PhotoCollection>
     */
    public function getPublished(): Collection;

    /**
     * Get featured collections
     *
     * @return Collection<int, PhotoCollection>
     */
    public function getFeatured(): Collection;

    /**
     * Find collection by slug
     */
    public function findBySlug(string $slug): ?PhotoCollection;

    /**
     * Get collections with photo count
     *
     * @return Collection<int, PhotoCollection>
     */
    public function getWithPhotoCount(): Collection;

    /**
     * Update collection by model
     */
    public function updateByModel(PhotoCollection $collection, array $data): PhotoCollection;
}
