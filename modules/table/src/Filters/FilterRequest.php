<?php

declare(strict_types=1);

namespace Modules\Table\Filters;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Contracts\Support\Arrayable;

class FilterRequest implements Arrayable
{
    public function __construct(
        public readonly Filter $filter,
        public readonly bool $enabled,
        public readonly Clause $clause,
        public readonly mixed $value = null,
    ) {}

    /**
     * Create a new FilterRequest instance.
     */
    public static function make(Filter $filter, ?array $data = null): static
    {
        if ($data === null || $data === []) {
            return new static(
                filter: $filter,
                enabled: $filter->hasDefaultValue(),
                clause: $filter->getDefaultClause(),
                value: $filter->getDefaultValue()
            );
        }

        $data['enabled'] = filter_var($data['enabled'] ?? true, FILTER_VALIDATE_BOOLEAN);

        return new static(
            filter: $filter,
            enabled: $data['enabled'],
            clause: Clause::tryFrom($data['clause'] ?? '') ?? $filter->getDefaultClause(),
            value: $data['value'] ?? null,
        );
    }

    /**
     * Applies the where clause to the given builder.
     */
    public function apply(Builder $builder): void
    {
        $handler = fn (Builder $builder) => $this->filter->handle($builder, $this->clause, $this->value);

        $this->filter->shouldBeAppliedUnwrapped()
            ? $handler($builder)
            : $builder->where($handler);
    }

    /**
     * Get the instance as an array.
     */
    public function toArray(): array
    {
        return [
            'enabled' => $this->enabled,
            'value' => $this->value,
            'clause' => $this->clause->value,
        ];
    }
}
