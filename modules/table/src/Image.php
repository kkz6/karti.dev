<?php

declare(strict_types=1);

namespace Modules\Table;

use Closure;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Traits\Conditionable;

class Image implements Arrayable
{
    use Conditionable;
    use HasUrl;

    public function __construct(
        protected array|string|null $url = null,
        protected ?string $icon = null,
        protected ImagePosition $position = ImagePosition::Start,
        protected ImageSize $size = ImageSize::Medium,
        protected bool $rounded = false,
        protected ?int $width = null,
        protected ?int $height = null,
        protected ?string $class = null,
        protected ?string $alt = null,
        protected ?string $title = null,
        protected ?int $limit = null,
    ) {
        if (! is_null($width) || ! is_null($height)) {
            $this->size = ImageSize::Custom;
        }
    }

    /**
     * Set the URL.
     */
    public function to(array|string|null $url = null): self
    {
        $this->url = blank($url) ? null : $url;

        return $this;
    }

    /**
     * Alias of the `to` method.
     */
    public function url(array|string|null $url = null): self
    {
        return $this->to($url);
    }

    /**
     * Pass the item and this instance to the given resolver. Return the
     * result of the resolver if it's a string, otherwise return the
     * array representation of the instance.
     */
    public static function resolve(mixed $item, Closure|callable|null $resolver = null): ?array
    {
        if (is_null($resolver)) {
            return null;
        }

        $instance = new self;

        if (is_string($result = $resolver($item, $instance))) {
            return blank($result) ? null : (new self($result))->toArray();
        }

        return $instance->toArray();
    }

    /**
     * Sets the icon instead of the image URL.
     */
    public function icon(?string $icon = null): static
    {
        $this->icon = blank($icon) ? null : $icon;

        return $this;
    }

    /**
     * Sets the position of the image.
     */
    public function position(ImagePosition $position): static
    {
        $this->position = $position;

        return $this;
    }

    /**
     * Sets the image position to the start.
     */
    public function start(): static
    {
        return $this->position(ImagePosition::Start);
    }

    /**
     * Sets the image position to the end.
     */
    public function end(): static
    {
        return $this->position(ImagePosition::End);
    }

    /**
     * Sets the size of the image.
     */
    public function size(ImageSize $size): static
    {
        $this->size = $size;

        if ($size !== ImageSize::Custom) {
            $this->width = null;
            $this->height = null;
        }

        return $this;
    }

    /**
     * Sets the image size to small.
     */
    public function small(): static
    {
        return $this->size(ImageSize::Small);
    }

    /**
     * Sets the image size to medium.
     */
    public function medium(): static
    {
        return $this->size(ImageSize::Medium);
    }

    /**
     * Sets the image size to large.
     */
    public function large(): static
    {
        return $this->size(ImageSize::Large);
    }

    /**
     * Sets the image size to extra large.
     */
    public function extraLarge(): static
    {
        return $this->size(ImageSize::ExtraLarge);
    }

    /**
     * Sets whether the image should have rounded corners.
     */
    public function rounded(bool $rounded = true): static
    {
        $this->rounded = $rounded;

        return $this;
    }

    /**
     * Sets custom width and height dimensions for the image.
     * Updates the image size to Custom when dimensions are provided,
     * or resets to Medium if both dimensions are null and the current size is Custom.
     */
    public function dimensions(?int $width = null, ?int $height = null): static
    {
        // Update dimensions if provided
        $this->width = $width ?? $this->width;
        $this->height = $height ?? $this->height;

        if (func_num_args() === 2 && is_null($width) && is_null($height)) {
            $this->width = null;
            $this->height = null;
        }

        // Determine appropriate size based on dimensions
        if ($this->width !== null || $this->height !== null) {
            $this->size(ImageSize::Custom);
        } elseif ($this->size === ImageSize::Custom) {
            $this->size(ImageSize::Medium);
        }

        return $this;
    }

    /**
     * Sets the width of the image.
     */
    public function width(?int $width): static
    {
        return $this->dimensions(width: $width);
    }

    /**
     * Sets the height of the image.
     */
    public function height(?int $height): static
    {
        return $this->dimensions(height: $height);
    }

    /**
     * Sets the class attribute of the image.
     */
    public function class(array|string|null $class): static
    {
        $this->class = Html::formatCssClass($class);

        return $this;
    }

    /**
     * Sets the alt attribute of the image.
     */
    public function alt(?string $alt = null): static
    {
        $this->alt = blank($alt) ? null : $alt;

        return $this;
    }

    /**
     * Sets the title attribute of the image.
     */
    public function title(?string $title = null): static
    {
        $this->title = blank($title) ? null : $title;

        return $this;
    }

    /**
     * Sets the limit of the image.
     */
    public function limit(?int $limit = null): static
    {
        $this->limit = $limit;

        return $this;
    }

    /**
     * Get the instance as an array.
     */
    public function toArray(): array
    {
        $remaining = null;
        $url = $this->url;

        if (is_array($url) && ! is_null($this->limit)) {
            $remaining = count($url) > $this->limit ? count($url) - $this->limit : null;
            $url = array_slice($url, 0, $this->limit);
        }

        return array_filter([
            'url' => $url,
            'icon' => $this->icon,
            'position' => $this->position->value,
            'size' => $this->size->value,
            'rounded' => $this->rounded,
            'width' => $this->width,
            'height' => $this->height,
            'class' => $this->class,
            'alt' => $this->alt,
            'title' => $this->title,
            'remaining' => $remaining,
        ], fn ($value): bool => ! is_null($value));
    }
}
