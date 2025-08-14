<?php

declare(strict_types=1);

namespace Modules\Table\Http;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Modules\Table\Export;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use TypeError;

class ExportController
{
    /**
     * Handle the export request.
     */
    public function __invoke(ExportRequest $request): mixed
    {
        return $this->toResponse($request->getExport());
    }

    /**
     * Get the export response.
     */
    public function toResponse(Export $export): mixed
    {
        return match (true) {
            $export->queue                    => $this->toQueuedResponse($export),
            $export->using instanceof Closure => $this->toCustomUsingResponse($export),
            default                           => $export->makeExporter(),
        };
    }

    /**
     * Queue the export and respond with a dialog response.
     */
    private function toQueuedResponse(Export $export): JsonResponse
    {
        $export->dispatchJob();

        $response = $export->redirect instanceof Closure
            ? App::call($export->redirect)
            : null;

        if ($response && ! $response instanceof RedirectResponse) {
            throw new TypeError("The 'redirect' property must return an instance of RedirectResponse.");
        }

        return $this->toDialogResponse($export, $response);
    }

    /**
     * Execute the export using the given callback and respond with a dialog response
     * if the callback does not return a Response instance.
     */
    private function toCustomUsingResponse(Export $export): mixed
    {
        $response = $export->executeUsingCallback();

        if ($response instanceof Response || $export->asDownload) {
            return $response;
        }

        return $this->toDialogResponse($export);
    }

    /**
     * Respond with a dialog response and optional redirect.
     */
    private function toDialogResponse(Export $export, ?RedirectResponse $redirect = null): JsonResponse
    {
        return response()->json([
            'dialogTitle'   => blank($export->dialogTitle) ? null : $export->dialogTitle,
            'dialogMessage' => blank($export->dialogMessage) ? null : $export->dialogMessage,
            'targetUrl'     => $redirect?->getTargetUrl(),
        ]);
    }
}
