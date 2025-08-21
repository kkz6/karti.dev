<?php

declare(strict_types=1);

namespace Modules\Table\Enums;

enum SortDirection: string
{
    case Ascending  = 'asc';
    case Descending = 'desc';
}
