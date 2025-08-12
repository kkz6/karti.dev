<?php

declare(strict_types=1);

namespace Modules\Table;

enum ScrollPosition: string
{
    case TopOfPage = 'topOfPage';
    case TopOfTable = 'topOfTable';
    case Preserve = 'preserve';
}
