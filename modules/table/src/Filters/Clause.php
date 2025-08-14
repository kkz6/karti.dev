<?php

declare(strict_types=1);

namespace Modules\Table\Filters;

enum Clause: string
{
    case Equals        = 'equals';
    case NotEquals     = 'not_equals';
    case StartsWith    = 'starts_with';
    case EndsWith      = 'ends_with';
    case NotStartsWith = 'not_starts_with';
    case NotEndsWith   = 'not_ends_with';
    case Contains      = 'contains';
    case NotContains   = 'not_contains';

    case IsTrue   = 'is_true';
    case IsFalse  = 'is_false';
    case IsSet    = 'is_set';
    case IsNotSet = 'is_not_set';

    case Before        = 'before';
    case EqualOrBefore = 'equal_or_before';
    case After         = 'after';
    case EqualOrAfter  = 'equal_or_after';
    case Between       = 'between';
    case NotBetween    = 'not_between';

    case GreaterThan        = 'greater_than';
    case GreaterThanOrEqual = 'greater_than_or_equal';
    case LessThan           = 'less_than';
    case LessThanOrEqual    = 'less_than_or_equal';

    case In    = 'in';
    case NotIn = 'not_in';

    /**
     * Determine if the clause is negated.
     */
    public function isNegated(): bool
    {
        return in_array($this, [
            self::NotEquals,
            self::NotStartsWith,
            self::NotEndsWith,
            self::NotContains,
            self::NotBetween,
            self::NotIn,
        ]);
    }

    /**
     * Get the opposite of the negation.
     */
    public function getOppositeOfNegation(): self
    {
        return match (true) {
            $this === self::NotEquals     => self::Equals,
            $this === self::NotStartsWith => self::StartsWith,
            $this === self::NotEndsWith   => self::EndsWith,
            $this === self::NotContains   => self::Contains,
            $this === self::NotBetween    => self::Between,
            $this === self::NotIn         => self::In,
            default                       => $this,
        };
    }

    /**
     * Determine if the clause compares against a value.
     */
    public function isWithComparison(): bool
    {
        return ! $this->isWithoutComparison();
    }

    /**
     * Determine if the clause does not compare against a value.
     */
    public function isWithoutComparison(): bool
    {
        return in_array($this, [
            self::IsTrue,
            self::IsFalse,
            self::IsSet,
            self::IsNotSet,
        ]);
    }
}
