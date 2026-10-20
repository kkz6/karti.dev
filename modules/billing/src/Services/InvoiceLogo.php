<?php

namespace Modules\Billing\Services;

class InvoiceLogo
{
    /** Trim a rendering copy; uploaded and frozen source images remain unchanged. */
    public function trim(string $image): string
    {
        $prefix = 'data:image/png;base64,';
        if (! str_starts_with($image, $prefix)) {
            return $image;
        }
        $bytes = base64_decode(substr($image, strlen($prefix)), true);
        $info  = $bytes === false ? false : @getimagesizefromstring($bytes);
        if (! $info || $info[0] * $info[1] > 20000000) {
            return $image;
        }
        $decoded = @imagecreatefromstring($bytes);
        if (! $decoded) {
            return $image;
        }

        $cropped = null;
        try {
            imagepalettetotruecolor($decoded);
            $width  = imagesx($decoded);
            $height = imagesy($decoded);
            $left   = $width;
            $top    = $height;
            $right  = $bottom = -1;

            for ($y = 0; $y < $height; $y++) {
                for ($x = 0; $x < $width; $x++) {
                    // Ignore transparent margins and barely visible export noise (under 2% opacity).
                    if (((imagecolorat($decoded, $x, $y) >> 24) & 0x7F) >= 126) {
                        continue;
                    }
                    $left   = min($left, $x);
                    $top    = min($top, $y);
                    $right  = max($right, $x);
                    $bottom = max($bottom, $y);
                }
            }

            if ($right < $left || ($left === 0 && $top === 0 && $right === $width - 1 && $bottom === $height - 1)) {
                return $image;
            }
            $cropped = imagecrop($decoded, ['x' => $left, 'y' => $top, 'width' => $right - $left + 1, 'height' => $bottom - $top + 1]);
            if (! $cropped) {
                return $image;
            }
            imagesavealpha($cropped, true);
            ob_start();
            try {
                imagepng($cropped);

                return $prefix.base64_encode(ob_get_contents());
            } finally {
                ob_end_clean();
            }
        } finally {
            if ($cropped) {
                imagedestroy($cropped);
            }
            imagedestroy($decoded);
        }
    }
}
