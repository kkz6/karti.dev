<?php

declare(strict_types=1);

namespace Modules\Table;

enum PaginationType: string
{
    case Cursor = 'cursor';
    case Simple = 'simple';
    case Full   = 'full';

    /**
     * Get the method name to use on the Builder.
     */
    public function getBuilderMethod(): string
    {
        return match ($this) {
            self::Cursor => 'cursorPaginate',
            self::Simple => 'simplePaginate',
            self::Full   => 'paginate',
        };
    }
}
