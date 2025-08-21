<?php

declare(strict_types=1);

namespace Modules\Table\Enums;

enum Variant: string
{
    case Destructive = 'destructive';
    case Default     = 'default';
    case Info        = 'info';
    case Success     = 'success';
    case Warning     = 'warning';
    case Outline     = 'outline';
    case Secondary   = 'secondary';
    case Ghost       = 'ghost';
    case Link        = 'link';
}
