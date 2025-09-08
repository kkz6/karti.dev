<?php

declare(strict_types=1);

namespace Modules\Blog\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use Modules\Blog\Models\Tag;
use Modules\Shared\Services\Base\Contracts\BaseServiceInterface;

interface TagServiceInterface extends BaseServiceInterface
{
    /**
     * Find tag by slug
     */
    public function findBySlug(string $slug): ?Tag;

    /**
     * Get popular tags
     *
     * @return Collection<int, Tag>
     */
    public function getPopular(int $limit = 10): Collection;
}
