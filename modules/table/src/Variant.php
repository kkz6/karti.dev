<?php

declare(strict_types=1);

namespace Modules\Table;

enum Variant: string
{
    case Danger = 'danger';
    case Default = 'default';
    case Info = 'info';
    case Success = 'success';
    case Warning = 'warning';
}
