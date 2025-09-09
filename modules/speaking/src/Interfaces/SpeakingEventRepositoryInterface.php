<?php

declare(strict_types=1);

namespace Modules\Speaking\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Shared\Repositories\Base\Contracts\QueryableRepositoryInterface;
use Modules\Speaking\Models\SpeakingEvent;

/**
 * @extends QueryableRepositoryInterface<SpeakingEvent>
 */
interface SpeakingEventRepositoryInterface extends QueryableRepositoryInterface
{
    /**
     * Get published speaking events
     */
    public function getPublished(): Collection;

    /**
     * Get featured speaking events
     */
    public function getFeatured(): Collection;

    /**
     * Get events by type
     */
    public function getByType(string $type): Collection;

    /**
     * Get published events grouped by type
     */
    public function getPublishedGroupedByType(): Collection;

    /**
     * Find event by slug
     */
    public function findBySlug(string $slug): ?SpeakingEvent;
}
