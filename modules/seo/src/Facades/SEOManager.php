<?php

namespace Modules\Seo\Facades;

use Illuminate\Support\Facades\Facade;

class SEOManager extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return 'seo-manager';
    }
}
