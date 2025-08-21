<?php

declare(strict_types=1);

namespace Modules\Table\Traits;

/**
 * @property ?array $meta
 */
trait HasMeta
{
    /**
     * Set the Meta Data.
     */
    public function meta(array $meta): static
    {
        $this->meta = $meta;

        return $this;
    }
}
