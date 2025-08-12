<?php

declare(strict_types=1);

namespace Modules\Table;

enum ActionType: string
{
    case Button = 'button';
    case Link = 'link';
}
