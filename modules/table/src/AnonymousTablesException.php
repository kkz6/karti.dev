<?php

declare(strict_types=1);

namespace Modules\Table;

use RuntimeException;

class AnonymousTablesException extends RuntimeException
{
    public static function new(): self
    {
        return new static('Anonymous Tables do not support Actions or Exporting.');
    }
}
