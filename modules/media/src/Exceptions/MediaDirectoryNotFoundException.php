<?php

declare(strict_types=1);

namespace Modules\Media\Exceptions;

use Illuminate\Contracts\Debug\ShouldntReport;
use Illuminate\Http\JsonResponse;

class MediaDirectoryNotFoundException extends MediaManagerException implements ShouldntReport
{
    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'code'    => 'directory_not_found',
        ], 404);
    }
}
