<?php

declare(strict_types=1);

namespace Modules\Table\Filters;

use Illuminate\Contracts\Database\Eloquent\Builder;

class NumericFilter extends Filter
{
    /**
     * {@inheritDoc}
     */
    public function apply(Builder $resource, string $attribute, Clause $clause, mixed $value): void
    {
        $column = $resource->qualifyColumn($attribute);

        match ($clause) {
            Clause::GreaterThan => $resource->where($column, '>', $value),
            Clause::GreaterThanOrEqual => $resource->where($column, '>=', $value),
            Clause::LessThan => $resource->where($column, '<', $value),
            Clause::LessThanOrEqual => $resource->where($column, '<=', $value),
            Clause::Equals => $resource->where($column, $value),
            Clause::NotEquals => $resource->where($column, '!=', $value),
            Clause::Between => $resource->whereBetween($column, $value),
            Clause::NotBetween => $resource->whereNotBetween($column, $value),
            default => throw UnsupportedClauseException::for($clause),
        };
    }

    /**
     * {@inheritDoc}
     */
    public function validate(mixed $value, Clause $clause, Builder $resource): mixed
    {
        if ($clause === Clause::Between || $clause === Clause::NotBetween) {
            if (! is_array($value) || count($value) !== 2) {
                return null;
            }

            $value = array_values($value);

            return is_numeric($value[0]) && is_numeric($value[1]) ? $value : null;
        }

        return is_numeric($value) ? $value : null;
    }

    /**
     * {@inheritDoc}
     */
    public static function defaultClauses(): array
    {
        return [
            Clause::Equals,
            Clause::NotEquals,
            Clause::GreaterThan,
            Clause::GreaterThanOrEqual,
            Clause::LessThan,
            Clause::LessThanOrEqual,
            Clause::Between,
            Clause::NotBetween,
        ];
    }
}
