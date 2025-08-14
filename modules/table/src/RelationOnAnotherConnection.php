<?php

declare(strict_types=1);

namespace Modules\Table;

use Closure;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOneOrMany;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Str;
use Modules\Table\Filters\Clause;
use Modules\Table\Filters\UnsupportedNestedRelationException;
use Modules\Table\Filters\UnsupportedRelationTypeException;

class RelationOnAnotherConnection
{
    protected Relation $relation;

    public function __construct(
        protected Builder $resource,
        protected string $relationshipName,
        protected string $relationshipColumn,
        protected Closure $applier,
        protected Clause $clause,
        protected mixed $value
    ) {

        if (Str::of($relationshipName)->contains('.')) {
            throw UnsupportedNestedRelationException::new();
        }

        $this->relation = $this->resource->getModel()->{$this->relationshipName}();
    }

    public static function make(
        Builder $resource,
        string $relationship,
        Closure $applier,
        Clause $clause,
        mixed $value
    ): self {
        $column       = Str::afterLast($relationship, '.');
        $relationship = Str::beforeLast($relationship, '.');

        return new self($resource, $relationship, $column, $applier, $clause, $value);
    }

    public function apply(?Builder $query = null): void
    {
        $query ??= $this->resource;

        match (true) {
            $this->relation instanceof BelongsTo     => $this->handleBelongsTo($query),
            $this->relation instanceof HasOneOrMany  => $this->handleHasOneOrMany($query),
            $this->relation instanceof BelongsToMany => $this->handleBelongsToMany($query),
            default                                  => throw UnsupportedRelationTypeException::new(),
        };
    }

    /**
     * Return a query builder of the related model with the constraints applied from the given applier.
     */
    protected function getRelatedQueryWithConstraints(): Builder
    {
        return $this->relation->getQuery()->getModel()->query()->tap(
            fn (Builder $query) => ($this->applier)($query, $this->relationshipColumn, $this->clause->getOppositeOfNegation(), $this->value)
        );
    }

    /**
     * Apply the filter to a 'BelongsTo' relationship on another connection.
     */
    protected function handleBelongsTo(Builder $query): void
    {
        assert($this->relation instanceof BelongsTo);

        $results = $this->getRelatedQueryWithConstraints()
            ->pluck($this->relation->getQualifiedOwnerKeyName());

        $this->clause->isNegated()
            ? $query->whereNotIn($this->relation->getQualifiedForeignKeyName(), $results)
            : $query->whereIn($this->relation->getQualifiedForeignKeyName(), $results);
    }

    /**
     * Apply the filter to a 'HasOne' or 'HasMany' relationship on another connection.
     */
    protected function handleHasOneOrMany(Builder $query): void
    {
        assert($this->relation instanceof HasOneOrMany);

        $results = $this->getRelatedQueryWithConstraints()
            ->pluck($this->relation->getQualifiedForeignKeyName());

        $this->clause->isNegated()
            ? $query->whereNotIn($this->relation->getQualifiedParentKeyName(), $results)
            : $query->whereIn($this->relation->getQualifiedParentKeyName(), $results);
    }

    /**
     * Apply the filter to a 'BelongsToMany' relationship on another connection
     * with the pivot table on another connection as well.
     */
    protected function handleBelongsToMany(Builder $query): void
    {
        assert($this->relation instanceof BelongsToMany);

        $results = $this->getRelatedQueryWithConstraints()
            ->selectSub(
                $this->relation->newPivotStatement()
                    ->select($this->relation->getQualifiedForeignPivotKeyName())
                    ->whereColumn($this->relation->getQualifiedRelatedPivotKeyName(), $this->relation->getQualifiedRelatedKeyName())
                    ->limit(1),
                $this->relation->getForeignPivotKeyName()
            )
            ->pluck($this->relation->getForeignPivotKeyName());

        $this->clause->isNegated()
            ? $query->whereNotIn($this->relation->getQualifiedParentKeyName(), $results)
            : $query->whereIn($this->relation->getQualifiedParentKeyName(), $results);
    }
}
