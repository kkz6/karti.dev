<?php

declare(strict_types=1);

namespace Modules\Table\Filters;

use Illuminate\Contracts\Database\Eloquent\Builder;

class BooleanFilter extends Filter
{
    /**
     * {@inheritDoc}
     */
    public function apply(Builder $resource, string $attribute, Clause $clause, mixed $value): void
    {
        $column = $resource->qualifyColumn($attribute);

        match ($clause) {
            Clause::IsTrue  => $resource->where($column, true),
            Clause::IsFalse => $resource->where($column, false),
            default         => throw UnsupportedClauseException::for($clause),
        };
    }

    /**
     * {@inheritDoc}
     */
    public function default(mixed $value, ?Clause $clause = null): static
    {
        $this->defaultValue  = null;
        $this->defaultClause = $value ? Clause::IsTrue : Clause::IsFalse;

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function validate(mixed $value, Clause $clause, Builder $resource): mixed
    {
        return null;
    }

    /**
     * {@inheritDoc}
     */
    public static function defaultClauses(): array
    {
        return [
            Clause::IsTrue,
            Clause::IsFalse,
        ];
    }
}
