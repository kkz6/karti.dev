<?php

declare(strict_types=1);

namespace Modules\Table\Columns;

enum ColumnAlignment: string
{
    case Left   = 'left';
    case Center = 'center';
    case Right  = 'right';
}
