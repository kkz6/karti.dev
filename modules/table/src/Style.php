<?php

declare(strict_types=1);

namespace Modules\Table;

/**
 * @deprecated Use the Variant enum instead.
 */
enum Style: string
{
    case Danger = 'danger';
    case Default = 'default';
    case Info = 'info';
    case Success = 'success';
    case Warning = 'warning';
}
