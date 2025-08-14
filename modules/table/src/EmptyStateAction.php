<?php

declare(strict_types=1);

namespace Modules\Table;

use Closure;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Traits\Conditionable;
use Illuminate\Support\Traits\Tappable;

class EmptyStateAction implements Arrayable
{
    use Conditionable;
    use HasDataAttributes;
    use HasMeta;
    use Tappable;

    public function __construct(
        public string $label,
        public Closure|string $url,
        public Variant $variant,
        public ?string $buttonClass,
        public ?string $icon,
        public ?array $dataAttributes,
        public ?array $meta,
    ) {}

    /**
     * Create a new EmptyStateAction instance.
     */
    public static function make(
        string $label,
        Closure|callable|string $url,
        Variant $variant = Variant::Info,
        ?string $buttonClass = null,
        ?string $icon = null,
        ?array $dataAttributes = null,
        ?array $meta = null,
    ): self {
        if (! is_string($url)) {
            $url = Helpers::asClosure($url);
        }

        return new self(
            label: $label,
            url: $url,
            variant: $variant,
            buttonClass: $buttonClass,
            icon: $icon,
            dataAttributes: $dataAttributes,
            meta: $meta,
        );
    }

    /**
     * Resolve the URL.
     */
    protected function resolveUrl(): Url
    {
        if (is_string($this->url)) {
            return new Url($this->url);
        }

        $url = new Url;

        return call_user_func($this->url, $url) ?? $url;
    }

    /**
     * Get the instance as an array.
     */
    public function toArray(): array
    {
        return [
            'label'          => $this->label,
            'url'            => $this->resolveUrl()->toArray(),
            'variant'        => $this->variant->value,
            'buttonClass'    => $this->buttonClass,
            'icon'           => $this->icon,
            'dataAttributes' => $this->buildDataAttributes(),
            'meta'           => $this->meta,
        ];
    }
}
