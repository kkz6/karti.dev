<?php

namespace Modules\Media\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Modules\Media\Models\Media;
use Modules\Media\Support\ResponsiveImages;

class ResponsiveImageController
{
    public function __invoke(Media $media, string $preset, ResponsiveImages $images)
    {
        // Signed URLs only. A missing/unsupported derivative must never fall back to the original.
        abort_unless($images->supports($media), 404);
        $variant = $images->generate($media, $preset);
        abort_unless($variant, 404);

        return Storage::disk($variant->disk)->response($variant->getDiskPath(), null, [
            'Content-Type'           => $variant->mime_type,
            'Cache-Control'          => 'private, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
