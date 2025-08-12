<?php

declare(strict_types=1);

namespace Modules\Table\Filters;

use RuntimeException;

class UnsupportedRelationTypeException extends RuntimeException
{
    public static function new(): static
    {
        return new static(
            'Relationship type is not supported when related through another database connection.'
        );
    }
}
