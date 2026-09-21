<?php

namespace Modules\Settings\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Settings\Support\EmailConfiguration;
use Symfony\Component\HttpFoundation\Response;

class ApplyEmailSettings
{
    public function __construct(private readonly EmailConfiguration $configuration) {}

    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('environment_mailer', config('mail.default'));

        return $this->configuration->run(fn () => $next($request));
    }
}
