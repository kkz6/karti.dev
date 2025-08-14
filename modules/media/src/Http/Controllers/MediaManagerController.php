<?php

namespace Modules\Media\Http\Controllers;

use Inertia\Inertia;

class MediaManagerController
{
    public function __invoke()
    {
        return Inertia::render('media::index');
    }
}
