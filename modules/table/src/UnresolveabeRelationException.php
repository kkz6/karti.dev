<?php

declare(strict_types=1);

namespace Modules\Table;

use RuntimeException;

class UnresolveabeRelationException extends RuntimeException
{
    public static function new(): static
    {
        return new static(
            'The relation could not be resolved.'
        );
    }
}
