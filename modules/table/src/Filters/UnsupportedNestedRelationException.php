<?php

declare(strict_types=1);

namespace Modules\Table\Filters;

use RuntimeException;

class UnsupportedNestedRelationException extends RuntimeException
{
    public static function new(): static
    {
        return new static(
            'Nested relationships with more than one level are not supported when related through another database connection.'
        );
    }
}
