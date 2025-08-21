<?php

declare(strict_types=1);

namespace Modules\Table\Enums;

enum ColumnAlignment: string
{
    case Left   = 'left';
    case Center = 'center';
    case Right  = 'right';
}
