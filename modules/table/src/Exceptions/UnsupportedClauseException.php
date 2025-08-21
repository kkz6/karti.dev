<?php

declare(strict_types=1);

namespace Modules\Table\Exception;

use Modules\Table\Filters\Clause;
use RuntimeException;

class UnsupportedClauseException extends RuntimeException
{
    public static function for(Clause $clause): static
    {
        return new static(sprintf('Unsupported clause [%s]', $clause->value));
    }
}
