<?php

declare(strict_types=1);

namespace Modules\Table;

enum ImageSize: string
{
    case Small      = 'small';
    case Medium     = 'medium';
    case Large      = 'large';
    case ExtraLarge = 'extra-large';
    case Custom     = 'custom';
}
