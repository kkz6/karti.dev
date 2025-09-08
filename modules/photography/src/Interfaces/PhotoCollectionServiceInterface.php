<?php

declare(strict_types=1);

namespace Modules\Photography\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Photography\Models\PhotoCollection;
use Modules\Shared\Services\Base\Contracts\BaseServiceInterface;

interface PhotoCollectionServiceInterface extends BaseServiceInterface
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
     * Publish collection
     */
    public function publish(string|int $id): bool;

    /**
     * Unpublish collection
     */
    public function unpublish(string|int $id): bool;
}
