<?php

declare(strict_types=1);

namespace Modules\Table;

use Closure;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Traits\Conditionable;
use Modules\Table\Traits\HasUrl;
use RuntimeException;

class Url implements Arrayable
{
    use Conditionable;
    use HasUrl;

    public function __construct(
        protected string $url = '',
        protected bool $preserveScroll = false,
        protected bool $preserveState = false,
        protected bool $openInNewTab = false,
        protected bool|string $asDownload = false,
        protected bool $disabled = false,
        protected bool $hidden = false,
        protected bool|array $modal = false,
    ) {}

    /**
     * Pass the item and this instance to the given resolver. Return the
     * result of the resolver if it's a string, otherwise return the
     * array representation of the instance.
     */
    public static function resolve(mixed $item, Closure|callable|null $resolver = null): string|array|null
    {
        if (is_null($resolver)) {
            return null;
        }

        $instance = new self;

        if (is_string($result = $resolver($item, $instance))) {
            return blank($result) ? null : $result;
        }

        return $instance->isDirty() ? $instance->toArray() : null;
    }

    /**
     * Set whether to preserve scroll position when navigating.
     */
    public function preserveScroll(bool $preserveScroll = true): self
    {
        $this->preserveScroll = $preserveScroll;

        return $this;
    }

    /**
     * Set whether to preserve component state when navigating.
     */
    public function preserveState(bool $preserveState = true): self
    {
        $this->preserveState = $preserveState;

        return $this;
    }

    /**
     * Set whether to open the URL in a new tab.
     */
    public function openInNewTab(bool $openInNewTab = true): self
    {
        $this->openInNewTab = $openInNewTab;

        return $this;
    }

    /**
     * Set whether the URL should be downloaded.
     */
    public function asDownload(bool|string $asDownload = true): self
    {
        $this->asDownload = $asDownload;

        return $this;
    }

    /**
     * Set whether the URL should be disabled.
     */
    public function disabled(bool $disabled = true): self
    {
        $this->disabled = $disabled;

        return $this;
    }

    /**
     * Set whether the URL should be hidden.
     */
    public function hidden(bool $hidden = true): self
    {
        $this->hidden = $hidden;

        return $this;
    }

    /**
     * Set whether the URL should be disabled and hidden.
     */
    public function disabledAndHidden(bool $disabledAndHidden = true): self
    {
        return $this->disabled($disabledAndHidden)->hidden($disabledAndHidden);
    }

    /**
     * Recursively sanitizes the modal visit array by removing
     * null values and empty arrays.
     */
    public static function sanitizeModalVisitArray(array $array): array
    {
        $result = [];

        foreach ($array as $key => $value) {
            if (is_array($value)) {
                if (($filtered = static::sanitizeModalVisitArray($value)) !== []) {
                    $result[$key] = $filtered;
                }
            } elseif ($value !== null) {
                $result[$key] = $value;
            }
        }

        return $result;
    }

    /**
     * Determine if the URL instance is dirty.
     */
    public function isDirty(): bool
    {
        return $this->url !== ''
            || $this->preserveScroll
            || $this->preserveState
            || $this->openInNewTab
            || $this->asDownload
            || $this->disabled
            || $this->hidden
            || $this->modal;
    }

    /**
     * Get the instance as an array.
     */
    public function toArray(): array
    {
        return [
            'url'            => $this->url,
            'preserveScroll' => $this->preserveScroll,
            'preserveState'  => $this->preserveState,
            'openInNewTab'   => $this->openInNewTab,
            'asDownload'     => $this->asDownload,
            'disabled'       => $this->disabled,
            'hidden'         => $this->hidden,
            'modal'          => $this->modal,
        ];
    }
}
