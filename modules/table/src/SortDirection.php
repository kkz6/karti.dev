<?php

declare(strict_types=1);

namespace Modules\Table;

enum SortDirection: string
{
    case Ascending  = 'asc';
    case Descending = 'desc';
}
