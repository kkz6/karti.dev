<?php

namespace Modules\Analytics\Services;

use Illuminate\Http\Request;

class PublicPageTracking
{
    public function allows(Request $request): bool
    {
        // Signed-in reviews, including unpublished article previews, never load or record analytics.
        if ($request->user()) {
            return false;
        }

        // A positive route list excludes admin, auth, private invoice and signed-link pages.
        return $request->isMethod('GET')
            && in_array($request->route()?->getName(), config('traffic.routes', []), true)
            && $request->header('DNT') !== '1'
            && $request->header('Sec-GPC') !== '1';
    }
}
