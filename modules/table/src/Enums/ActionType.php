<?php

declare(strict_types=1);

namespace Modules\Table\Enums;

enum ActionType: string
{
    case Button = 'button';
    case Link   = 'link';
}
