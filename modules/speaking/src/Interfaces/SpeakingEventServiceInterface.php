<?php

declare(strict_types=1);

namespace Modules\Speaking\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Speaking\Models\SpeakingEvent;

interface SpeakingEventServiceInterface
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
     * Get published events formatted for frontend display, grouped by type
     */
    public function getPublishedForFrontend(): array;

    /**
     * Find event by slug
     */
    public function findBySlug(string $slug): ?SpeakingEvent;
}
