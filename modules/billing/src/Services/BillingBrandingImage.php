<?php

namespace Modules\Billing\Services;

use Illuminate\Support\Facades\Storage;
use Modules\Media\Models\Media;

class BillingBrandingImage
{
    public function image(Media $media): ?string
    {
        $image = null;
        if ($media->original_media_id === null) {
            try {
                $stream = Storage::disk($media->disk)->readStream($media->getDiskPath());
            } catch (\Throwable) {
                return null;
            }
            if (is_resource($stream)) {
                try {
                    $bytes = stream_get_contents($stream, 5 * 1024 * 1024 + 1);
                } finally {
                    fclose($stream);
                }
                $info = @getimagesizefromstring($bytes);
                if ($info && strlen($bytes) <= 5 * 1024 * 1024 && $info[0] * $info[1] <= 20000000 && in_array($info['mime'], ['image/png', 'image/jpeg', 'image/webp'], true)) {
                    $decoded = @imagecreatefromstring($bytes);
                    if (! $decoded) {
                        return null;
                    }
                    if ($info['mime'] === 'image/webp') {
                        ob_start();
                        try {
                            imagepng($decoded);
                            $bytes = ob_get_contents();
                        } finally {
                            ob_end_clean();
                        }
                        $image = 'data:image/png;base64,'.base64_encode($bytes);
                    } else {
                        $image = 'data:'.$info['mime'].';base64,'.base64_encode($bytes);
                    }
                    imagedestroy($decoded);
                }
            }
        }

        return $image;
    }
}
