<?php

declare(strict_types=1);

namespace Modules\Table\Filters;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Throwable;

class DateFilter extends Filter
{
    /**
     * {@inheritDoc}
     */
    public function apply(Builder $resource, string $attribute, Clause $clause, mixed $value): void
    {
        /** @var CarbonImmutable|array<int, CarbonImmutable> $value */
        $value = is_array($value)
            ? [$value[0]->startOfDay(), $value[1]->endOfDay()]
            : $value->startOfDay();

        $column = $resource->qualifyColumn($attribute);

        match ($clause) {
            Clause::Before => $resource->whereDate($column, '<', $value),
            Clause::After => $resource->whereDate($column, '>', $value),
            Clause::EqualOrBefore => $resource->whereDate($column, '<=', $value),
            Clause::EqualOrAfter => $resource->whereDate($column, '>=', $value),
            Clause::Equals => $resource->whereDate($column, $value),
            Clause::NotEquals => $resource->whereDate($column, '!=', $value),
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

            $value[0] = static::typeAsDate($value[0]);
            $value[1] = static::typeAsDate($value[1]);

            return $value[0] instanceof CarbonImmutable && $value[1] instanceof CarbonImmutable ? $value : null;
        }

        return static::typeAsDate($value);
    }

    /**
     * Attempt to parse the given value as a date.
     */
    public static function typeAsDate(mixed $value): ?CarbonImmutable
    {
        try {
            if ($date = rescue(fn (): CarbonImmutable => CarbonImmutable::parse($value), report: false)) {
                return $date;
            }
        } catch (Throwable) {
            //
        }

        return null;
    }

    /**
     * {@inheritDoc}
     */
    public static function defaultClauses(): array
    {
        return [
            Clause::Before,
            Clause::After,
            Clause::EqualOrBefore,
            Clause::EqualOrAfter,
            Clause::Equals,
            Clause::NotEquals,
            Clause::Between,
            Clause::NotBetween,
        ];
    }
}
