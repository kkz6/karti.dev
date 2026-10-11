<?php

namespace Modules\Billing\Services;

use Illuminate\Support\Facades\File;

class BillingPdfFonts
{
    /** Bundled Perfex FreeSans faces; no remote font requests or vendor writes. */
    public static function options(): array
    {
        $runtime = storage_path('framework/cache/billing-pdf');
        File::ensureDirectoryExists($runtime, 0700);
        $fonts    = __DIR__.'/../../resources/fonts/';
        $manifest = json_encode(['freesans' => [
            'normal'      => $fonts.'FreeSans',
            'bold'        => $fonts.'FreeSansBold',
            'italic'      => $fonts.'FreeSansOblique',
            'bold_italic' => $fonts.'FreeSansBoldOblique',
        ]], JSON_THROW_ON_ERROR);
        $path = $runtime.'/installed-fonts.json';
        if (! is_file($path) || file_get_contents($path) !== $manifest) {
            File::replace($path, $manifest, 0600);
        }

        return ['defaultFont' => 'FreeSans', 'fontDir' => $runtime, 'fontCache' => $runtime, 'tempDir' => $runtime];
    }
}
