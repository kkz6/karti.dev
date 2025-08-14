<?php

declare(strict_types=1);

namespace Modules\Table\Filters;

use Closure;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Str;
use Illuminate\Support\Traits\Conditionable;
use Illuminate\Support\Traits\Tappable;
use Modules\Table\BelongsToTable;
use Modules\Table\HasMeta;
use Modules\Table\Helpers;
use Modules\Table\QueryBuilder;
use Modules\Table\RelationOnAnotherConnection;
use TypeError;

abstract class Filter implements Arrayable
{
    use BelongsToTable;
    use Conditionable;
    use HasMeta;
    use Tappable;

    protected mixed $defaultValue = null;

    protected ?Clause $defaultClause = null;

    public function __construct(
        public string $attribute,
        public ?string $label = null,
        bool $nullable = false,
        protected ?array $clauses = null,
        protected ?Closure $applyUsing = null,
        protected ?Closure $validateUsing = null,
        protected ?array $meta = null,
        protected bool $applyUnwrapped = false,
    ) {
        if (blank($label)) {
            $this->label = Str::headline($this->attribute);
        }

        if ($clauses === null) {
            $this->clauses = static::defaultClauses();

            if ($nullable) {
                $this->nullable();
            }
        } else {
            $this->clauses($clauses);
        }
    }

    /**
     * Create a new Filter instance.
     */
    public static function make(
        string $attribute,
        ?string $label = null,
        bool $nullable = false,
        ?array $clauses = null,
        Closure|callable|null $applyUsing = null,
        Closure|callable|null $validateUsing = null,
        ?array $meta = null,
        bool $applyUnwrapped = false,
    ): static {
        return new static(
            attribute: $attribute,
            label: $label,
            nullable: $nullable,
            clauses: $clauses,
            applyUsing: Helpers::asClosure($applyUsing),
            validateUsing: Helpers::asClosure($validateUsing),
            meta: $meta,
            applyUnwrapped: $applyUnwrapped,
        );
    }

    /**
     * Set the clauses of the filter.
     */
    public function clauses(array $clauses): static
    {
        foreach ($clauses as $clause) {
            if (! $clause instanceof Clause) {
                throw new TypeError('Each clause must be an instance of '.Clause::class);
            }
        }

        $this->clauses = $clauses;

        return $this;
    }

    /**
     * Mark the filter as nullable.
     */
    public function nullable(): static
    {
        $this->clauses[] = Clause::IsSet;
        $this->clauses[] = Clause::IsNotSet;

        return $this;
    }

    /**
     * Set a custom callback to apply the filter.
     */
    public function applyUsing(Closure|callable $closure, bool $unwrapped = false): static
    {
        $this->applyUsing = Helpers::asClosure($closure);

        return $this->applyUnwrapped($unwrapped);
    }

    /**
     * Set a boolean whether the filter should be applied unwrapped.
     */
    public function applyUnwrapped(bool $value = true): static
    {
        $this->applyUnwrapped = $value;

        return $this;
    }

    /**
     * Set a custom callback to validate the value of the filter.
     */
    public function validateUsing(Closure|callable $closure): static
    {
        $this->validateUsing = Helpers::asClosure($closure);

        return $this;
    }

    /**
     * Set the default value on the filter.
     */
    public function default(mixed $value, ?Clause $clause = null): static
    {
        $this->defaultValue  = $value;
        $this->defaultClause = $clause;

        return $this;
    }

    /**
     * Return a boolean whether the filter has a default value.
     */
    public function hasDefaultValue(): bool
    {
        return $this->defaultValue !== null || $this->defaultClause instanceof Clause;
    }

    /**
     * Get the default value of the filter.
     */
    public function getDefaultValue(): mixed
    {
        return $this->defaultValue;
    }

    /**
     * Get the default clause of the filter.
     */
    public function getDefaultClause(): Clause
    {
        return $this->defaultClause ?? $this->clauses[0];
    }

    /**
     * Get the attribute of the filter.
     */
    public function getAttribute(): string
    {
        return $this->attribute;
    }

    /**
     * Get the clauses of the filter.
     */
    public function getClauses(): array
    {
        return $this->clauses;
    }

    /**
     * Return a boolean whether the filter should be applied
     * unwrapped, so not in a wrapped 'where' clause.
     */
    public function shouldBeAppliedUnwrapped(): bool
    {
        return $this->applyUnwrapped;
    }

    /**
     * The default clauses for the filter.
     */
    abstract public static function defaultClauses(): array;

    /**
     * Returns a boolean whether to columns refers to a relationship.
     */
    public function isNested(): bool
    {
        return Str::contains($this->attribute, '.');
    }

    /**
     * Returns the name of the relationship.
     */
    public function relationshipName(): string
    {
        return Str::beforeLast($this->attribute, '.');
    }

    /**
     * Returns the target column on the relationship.
     */
    public function relationshipColumn(): string
    {
        return Str::afterLast($this->attribute, '.');
    }

    /**
     * Apply the filter to the given resource.
     */
    abstract public function apply(Builder $resource, string $attribute, Clause $clause, mixed $value): void;

    /**
     * Validate the incoming value.
     */
    abstract public function validate(mixed $value, Clause $clause, Builder $resource): mixed;

    /**
     * Normalize the incoming value using the default or custom validator if provided.
     */
    public function normalizeValue(mixed $value, Clause $clause, Builder $resource): mixed
    {
        $validator = $this->validateUsing ?? fn (mixed $value, Clause $clause, Builder $resource): mixed => $clause->isWithoutComparison() ? null : $this->validate($value, $clause, $resource);

        return $validator($value, $clause, $resource);
    }

    /**
     * Normalize the incoming value and apply the filter to the given resource.
     */
    public function handle(Builder $resource, Clause $clause, mixed $value): void
    {
        if (! $this->applyUsing instanceof Closure && in_array($clause, [Clause::IsSet, Clause::IsNotSet])) {
            $this->applySetOrNotSet($resource, $clause);

            return;
        }

        $value = $this->normalizeValue($value, $clause, $resource);

        if (blank($value) && $clause->isWithComparison()) {
            return;
        }

        $applier = $this->applyUsing ?? function (Builder $resource, string $attribute, Clause $clause, mixed $value): void {
            $this->apply($resource, $attribute, $clause, $value);
        };

        if (! $this->isNested()) {
            $applier($resource, $this->getAttribute(), $clause, $value);

            return;
        }

        if (! QueryBuilder::isRelatedThroughAnotherConnection($resource->getModel(), $relationshipName = $this->relationshipName())) {
            $this->handleRelation($resource, $applier, $clause, $value);

            return;
        }

        RelationOnAnotherConnection::make($resource, $this->attribute, $applier, $clause, $value)->apply($resource);
    }

    /**
     * Apply the filter to a nested relationship.
     */
    protected function handleRelation(Builder $resource, Closure $applier, Clause $clause, mixed $value): void
    {
        if (! $clause->isNegated()) {
            $resource->whereHas(
                $this->relationshipName(),
                fn (Builder $query) => $applier($query, $this->relationshipColumn(), $clause, $value)
            );

            return;
        }

        $resource->where(function (Builder $resource) use ($applier, $clause, $value): void {
            $resource->doesntHave($this->relationshipName())->orWhereHas(
                $this->relationshipName(),
                fn (Builder $query) => $applier($query, $this->relationshipColumn(), $clause, $value)
            );
        });
    }

    /**
     * Apply the filter to the given resource when the clause is set or not set.
     */
    protected function applySetOrNotSet(Builder $resource, Clause $clause): void
    {
        match ([$clause, $this->isNested()]) {
            [Clause::IsSet, true] => $resource->has($this->relationshipName()),
            [Clause::IsNotSet, true] => $resource->doesntHave($this->relationshipName()),
            [Clause::IsSet, false] => $resource->whereNotNull($resource->qualifyColumn($this->getAttribute())),
            [Clause::IsNotSet, false] => $resource->whereNull($resource->qualifyColumn($this->getAttribute())),
            default => throw UnsupportedClauseException::for($clause),
        };
    }

    /**
     * Return an array representation of the filter.
     */
    public function toArray(): array
    {
        return [
            'type' => Str::of(class_basename(static::class))
                ->beforeLast('Filter')
                ->snake()
                ->replace('_', '-')
                ->value(),
            'attribute'       => $this->attribute,
            'label'           => $this->label,
            'clauses'         => $this->clauses,
            'meta'            => $this->meta,
            'hasDefaultValue' => $this->hasDefaultValue(),
        ];
    }
}
