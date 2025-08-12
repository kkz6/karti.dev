<?php

declare(strict_types=1);

namespace Modules\Table\Filters;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Modules\Table\QueryBuilder;

class TextFilter extends Filter
{
    /**
     * {@inheritDoc}
     */
    public function apply(Builder $resource, string $attribute, Clause $clause, mixed $value): void
    {
        $column = $resource->qualifyColumn($attribute);

        $likeOperator = QueryBuilder::getWhereLikeOperator($resource);
        $notLikeOperator = 'NOT '.$likeOperator;

        match ($clause) {
            Clause::Contains => $resource->where($column, $likeOperator, sprintf('%%%s%%', $value)),
            Clause::NotContains => $resource->where($column, $notLikeOperator, sprintf('%%%s%%', $value)),
            Clause::Equals => $resource->where($column, $value),
            Clause::NotEquals => $resource->where($column, '!=', $value),
            Clause::StartsWith => $resource->where($column, $likeOperator, $value.'%'),
            Clause::EndsWith => $resource->where($column, $likeOperator, '%'.$value),
            Clause::NotStartsWith => $resource->where($column, $notLikeOperator, $value.'%'),
            Clause::NotEndsWith => $resource->where($column, $notLikeOperator, '%'.$value),
            default => throw UnsupportedClauseException::for($clause),
        };
    }

    /**
     * {@inheritDoc}
     */
    public function validate(mixed $value, Clause $clause, Builder $resource): ?string
    {
        return is_string($value) || is_numeric($value) ? (string) $value : null;
    }

    /**
     * {@inheritDoc}
     */
    public static function defaultClauses(): array
    {
        return [
            Clause::Contains,
            Clause::NotContains,
            Clause::StartsWith,
            Clause::EndsWith,
            Clause::NotStartsWith,
            Clause::NotEndsWith,
            Clause::Equals,
            Clause::NotEquals,
        ];
    }
}
