<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\PostTooLargeException;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Modules\Shared\Http\Middleware\HandleAppearance;
use Modules\Shared\Http\Middleware\HandleInertiaRequests;
use Modules\Shared\Http\Middleware\HandleLocalization;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state', 'locale']);

        $middleware->web(append: [
            \Modules\Settings\Http\Middleware\ApplySiteSettings::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            HandleLocalization::class,
            \Modules\Analytics\Http\Middleware\TrackPageViews::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (PostTooLargeException $exception, Request $request) {
            if ($request->is('admin/media')) {
                $message = sprintf('This upload exceeds the server request limit of %s.', ini_get('post_max_size'));

                return response()->json([
                    'message' => $message,
                    'errors'  => ['file' => [$message]],
                ], 413);
            }
        });
    })->create();
