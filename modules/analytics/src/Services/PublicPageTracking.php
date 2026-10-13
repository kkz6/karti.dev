<?php

namespace Modules\Analytics\Services;

use Illuminate\Http\Request;

class PublicPageTracking
{
    public function allows(Request $request): bool
    {
        // A positive route list excludes admin, auth, private invoice and signed-link pages.
        return $request->isMethod('GET')
            && in_array($request->route()?->getName(), config('traffic.routes', []), true)
            && ! $request->user()
            && $request->header('DNT') !== '1'
            && $request->header('Sec-GPC') !== '1';
    }
}
