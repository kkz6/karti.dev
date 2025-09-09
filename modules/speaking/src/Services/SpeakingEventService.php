<?php

declare(strict_types=1);

namespace Modules\Speaking\Services;

use Illuminate\Database\Eloquent\Collection;
use Modules\Shared\Services\Base\Concretes\BaseService;
use Modules\Speaking\Interfaces\SpeakingEventRepositoryInterface;
use Modules\Speaking\Interfaces\SpeakingEventServiceInterface;
use Modules\Speaking\Models\SpeakingEvent;

/**
 * @extends BaseService<SpeakingEvent, SpeakingEventRepositoryInterface>
 *
 * @property SpeakingEventRepositoryInterface $repository
 */
class SpeakingEventService extends BaseService implements SpeakingEventServiceInterface
{
    public function __construct(
        private readonly SpeakingEventRepositoryInterface $speakingEventRepository
    ) {
        $this->setRepository($this->speakingEventRepository);
    }

    /**
     * Get published speaking events
     */
    public function getPublished(): Collection
    {
        return $this->repository->getPublished();
    }

    /**
     * Get featured speaking events
     */
    public function getFeatured(): Collection
    {
        return $this->repository->getFeatured();
    }

    /**
     * Get events by type
     */
    public function getByType(string $type): Collection
    {
        return $this->repository->getByType($type);
    }

    /**
     * Get published events formatted for frontend display, grouped by type
     */
    public function getPublishedForFrontend(): array
    {
        $events = $this->repository->getPublishedGroupedByType();

        return $events->map(function ($typeEvents) {
            return $typeEvents->map(function ($event) {
                return [
                    'title'       => $event->title,
                    'description' => $event->description,
                    'event'       => $event->event_name,
                    'cta'         => $event->cta_text,
                    'href'        => $event->url ?? '#',
                    'date'        => $event->event_date ? $event->event_date->format('Y-m-d') : null,
                    'type'        => $event->event_type,
                ];
            });
        })->toArray();
    }

    /**
     * Find event by slug
     */
    public function findBySlug(string $slug): ?SpeakingEvent
    {
        return $this->repository->findBySlug($slug);
    }
}
