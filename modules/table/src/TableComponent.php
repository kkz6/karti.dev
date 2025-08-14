<?php

declare(strict_types=1);

namespace Modules\Table;

enum TableComponent: string
{
    case Search = 'search';
    case None   = 'none';
}
