<?php

namespace Modules\Analytics\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Analytics\Services\RecordPageView;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class TrackPageViews
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    // Laravel runs terminable middleware after sending the response.
    public function terminate(Request $request, Response $response): void
    {
        try {
            app(RecordPageView::class)->record($request, $response);
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
