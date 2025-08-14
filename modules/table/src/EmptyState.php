<?php

declare(strict_types=1);

namespace Modules\Table;

use Closure;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Traits\Conditionable;
use Illuminate\Support\Traits\Tappable;

class EmptyState implements Arrayable
{
    use Conditionable;
    use HasDataAttributes;
    use HasMeta;
    use Tappable;

    /**
     * @param array<int, EmptyStateAction> $actions
     */
    public function __construct(
        public string $title,
        public ?string $message,
        public bool|string $icon,
        public array $actions,
        public ?array $dataAttributes,
        public ?array $meta,
    ) {}

    /**
     * Create a new EmptyState instance.
     */
    public static function make(
        string $title = 'No results found',
        ?string $message = null,
        bool|string $icon = true,
        array $actions = [],
        ?array $dataAttributes = null,
        ?array $meta = null,
    ): self {
        return new self(
            title: $title,
            message: $message,
            icon: $icon,
            actions: $actions,
            dataAttributes: $dataAttributes,
            meta: $meta,
        );
    }

    /**
     * Set the title of the empty state.
     */
    public function title(string $title): self
    {
        $this->title = $title;

        return $this;
    }

    /**
     * Set the message of the empty state.
     */
    public function message(?string $message = null): self
    {
        $this->message = $message;

        return $this;
    }

    /**
     * Set the icon of the empty state.
     */
    public function icon(bool|string $icon = true): self
    {
        $this->icon = $icon;

        return $this;
    }

    /**
     * Add an action to the empty state.
     */
    public function action(
        string $label,
        Closure|callable|string $url,
        Variant $variant = Variant::Info,
        ?string $buttonClass = null,
        ?string $icon = null,
        ?array $dataAttributes = null,
        ?array $meta = null,
    ): self {
        $this->actions[] = EmptyStateAction::make(
            label: $label,
            url: $url,
            variant: $variant,
            buttonClass: $buttonClass,
            icon: $icon,
            dataAttributes: $dataAttributes,
            meta: $meta,
        );

        return $this;
    }

    /*
     * Get the instance as an array.
     */
    public function toArray(): array
    {
        return [
            'title'          => $this->title,
            'message'        => $this->message,
            'icon'           => $this->icon,
            'actions'        => collect($this->actions)->toArray(),
            'dataAttributes' => $this->buildDataAttributes(),
            'meta'           => $this->meta,
        ];
    }
}
