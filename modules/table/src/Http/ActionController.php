<?php

declare(strict_types=1);

namespace Modules\Table\Http;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;

class ActionController
{
    /**
     * Handle the action request.
     */
    public function __invoke(ActionRequest $request): JsonResponse|RedirectResponse
    {
        $response = $request->getAction()->handle(
            $request->collect('keys')->values()->all()
        );

        $response = $response instanceof RedirectResponse ? $response : back();

        return $request->boolean('json')
            ? response()->json([
                'target_url' => $targetUrl = $response->getTargetUrl(), // Backwards compatibility
                'targetUrl'  => $targetUrl,
            ])
            : $response;
    }
}
