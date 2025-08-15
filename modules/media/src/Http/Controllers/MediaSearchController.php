<?php

namespace Modules\Media\Http\Controllers;

use Illuminate\Http\Request;
use Modules\Media\Support\MediaManager;

class MediaSearchController
{
    public function __construct(protected readonly MediaManager $manager) {}

    public function __invoke(Request $request)
    {
        $query = $request->q;
        $model = config('media-manager.model');

        return $model::where('filename', 'like', "%{$query}%")
            ->orWhere('title', 'like', "%{$query}%")
            ->orWhere('caption', 'like', "%{$query}%")
            ->orWhere('alt', 'like', "%{$query}%")
            ->orWhere('credit', 'like', "%{$query}%")
            ->get();
    }
}
