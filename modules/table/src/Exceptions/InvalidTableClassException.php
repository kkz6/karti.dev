<?php

declare(strict_types=1);

namespace Modules\Table\Exception;

use RuntimeException;

class InvalidTableClassException extends RuntimeException
{
    public static function new(string $class): self
    {
        return new static(sprintf('Table class [%s] is invalid.', $class));
    }
}
