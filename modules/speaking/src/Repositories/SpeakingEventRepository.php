<?php

declare(strict_types=1);

namespace Modules\Speaking\Repositories;

use Illuminate\Database\Eloquent\Collection;
use Modules\Shared\Repositories\Base\Concretes\QueryableRepository;
use Modules\Speaking\Interfaces\SpeakingEventRepositoryInterface;
use Modules\Speaking\Models\SpeakingEvent;

/**
 * @extends QueryableRepository<SpeakingEvent>
 */
class SpeakingEventRepository extends QueryableRepository implements SpeakingEventRepositoryInterface
{
    /**
     * Specify Model class name
     */
    public function getModelClass(): string
    {
        return SpeakingEvent::class;
    }

    /**
     * Get published speaking events
     */
    public function getPublished(): Collection
    {
        return SpeakingEvent::published()
            ->ordered()
            ->get();
    }

    /**
     * Get featured speaking events
     */
    public function getFeatured(): Collection
    {
        return SpeakingEvent::published()
            ->featured()
            ->ordered()
            ->get();
    }

    /**
     * Get events by type
     */
    public function getByType(string $type): Collection
    {
        return SpeakingEvent::published()
            ->byType($type)
            ->ordered()
            ->get();
    }

    /**
     * Get published events grouped by type
     */
    public function getPublishedGroupedByType(): Collection
    {
        return SpeakingEvent::published()
            ->ordered()
            ->get()
            ->groupBy('event_type');
    }

    /**
     * Find event by slug
     */
    public function findBySlug(string $slug): ?SpeakingEvent
    {
        return SpeakingEvent::published()
            ->where('slug', $slug)
            ->first();
    }

    /**
     * Get allowed filters for this repository.
     */
    public function getAllowedFilters(): array
    {
        return [
            'title',
            'event_name',
            'event_type',
            'status',
            'featured',
        ];
    }

    /**
     * Get allowed sorts for this repository.
     */
    public function getAllowedSorts(): array
    {
        return [
            'title',
            'event_name',
            'event_date',
            'event_type',
            'featured',
            'sort_order',
            'created_at',
        ];
    }

    /**
     * Get allowed includes for this repository.
     */
    public function getAllowedIncludes(): array
    {
        return [];
    }

    /**
     * Get allowed fields for this repository.
     */
    public function getAllowedFields(): array
    {
        return [
            'id',
            'title',
            'slug',
            'description',
            'event_name',
            'event_date',
            'event_type',
            'location',
            'url',
            'cta_text',
            'featured',
            'sort_order',
            'status',
            'created_at',
            'updated_at',
        ];
    }
}
