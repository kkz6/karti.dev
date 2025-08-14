<?php

declare(strict_types=1);

namespace Modules\Table\Filters;

use Closure;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Arr;

class SetFilter extends Filter
{
    /**
     * The options for the filter that will be displayed in the UI.
     */
    protected array $options = [];

    /**
     * Whether the filter allows multiple selections.
     */
    public bool $multiple = false;

    /**
     * The pending options to be set from a relation.
     */
    protected ?OptionsFromRelation $pendingOptionsFromRelation = null;

    /**
     * Mark the filter as allowing multiple selections.
     */
    public function multiple(bool $multiple = true): self
    {
        $this->multiple = $multiple;

        return $this;
    }

    /**
     * Set the options for the filter from a relation.
     */
    public function pluckOptionsFromRelation(string $value = 'name', ?string $relation = null): self
    {
        $this->pendingOptionsFromRelation = new OptionsFromRelation($this->attribute, $relation, $value);

        return $this;
    }

    /**
     * Set the options for the filter from an Eloquent Model.
     */
    public function pluckOptionsFromModel(Builder|string $model, string $value = 'name', ?string $key = null): self
    {
        /** @var Builder $builder */
        $builder = is_string($model) ? $model::query() : $model;

        $key ??= $builder->getModel()->getKeyName();

        return $this->options($builder->orderBy($value)->pluck($value, $key));
    }

    /**
     * Set the options for the filter.
     */
    public function options(Arrayable|iterable $options): self
    {
        $this->options = collect($options)->toArray();

        if (Arr::isList($this->options) && ! is_array(Arr::first($this->options))) {
            $this->options = array_combine($this->options, $this->options);
        }

        if (! is_array(Arr::first($this->options))) {
            $this->options = collect($this->options)->map(fn ($value, $key): array => ['value' => $key, 'label' => $value])->values()->toArray();
        }

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    protected function handleRelation(Builder $resource, Closure $applier, Clause $clause, mixed $value): void
    {
        // Make sure all items are present in the relation and no more.
        $checkAllItems = function (Builder $resource) use ($value): void {
            $resource->has($this->relationshipName(), '=', count($value));

            foreach ($value as $item) {
                $resource->whereRelation($this->relationshipName(), $this->relationshipColumn(), $item);
            }
        };

        match ([$clause, $this->multiple]) {
            [Clause::Equals, true] => $checkAllItems($resource),
            [Clause::NotEquals, true] => $resource->whereNot($checkAllItems),
            default => parent::handleRelation($resource, $applier, $clause, $value),
        };

    }

    /**
     * {@inheritDoc}
     */
    public function apply(Builder $resource, string $attribute, Clause $clause, mixed $value): void
    {
        $column = $resource->qualifyColumn($attribute);

        match ($clause) {
            Clause::Equals    => $resource->where($column, $value),
            Clause::NotEquals => $resource->where($column, '!=', $value),
            Clause::In        => $resource->whereIn($column, $value),
            Clause::NotIn     => $resource->whereNotIn($column, $value),
            default           => throw UnsupportedClauseException::for($clause),
        };
    }

    /**
     * {@inheritDoc}
     */
    public function validate(mixed $value, Clause $clause, Builder $resource): mixed
    {
        if ($clause === Clause::In || $clause === Clause::NotIn || $this->multiple) {
            // Build a new array with only string or numeric values.
            $new = [];

            if (is_array($value)) {
                foreach ($value as $item) {
                    if (is_string($item) || is_numeric($item)) {
                        $new[] = $item;
                    }
                }
            }

            return $new === [] ? null : $new;
        }

        return is_string($value) || is_numeric($value) ? $value : null;
    }

    /**
     * {@inheritDoc}
     */
    public static function defaultClauses(): array
    {
        return [
            Clause::In,
            Clause::NotIn,
            Clause::Equals,
            Clause::NotEquals,
        ];
    }

    /**
     * Only use the 'equals' clause.
     */
    public function withoutClause(): self
    {
        return $this->clauses([Clause::Equals]);
    }

    /**
     * {@inheritDoc}
     */
    protected function onTableSet(): void
    {
        if (is_null($this->pendingOptionsFromRelation)) {
            return;
        }

        $options = $this->pendingOptionsFromRelation
            ->setModel($this->table->resourceBuilder()->getModel())
            ->pluck();

        if (is_null($this->pendingOptionsFromRelation->relation)) {
            // The relation was resolved from the attribute name, so now we can
            // generate the attribute name based on the relation.
            $this->attribute = $this->pendingOptionsFromRelation->generateFilterAttribute();
        }

        $this->options($options);
        $this->pendingOptionsFromRelation = null;
    }

    /*
     * Get the options for the filter.
     */
    public function getOptions(): array
    {
        return $this->options;
    }

    /**
     * Determine if the filter allows multiple selections.
     */
    public function isMultiple(): bool
    {
        return $this->multiple;
    }

    /**
     * {@inheritDoc}
     */
    public function toArray(): array
    {
        return array_merge(parent::toArray(), [
            'options'  => $this->getOptions(),
            'multiple' => $this->isMultiple(),
        ]);
    }
}
