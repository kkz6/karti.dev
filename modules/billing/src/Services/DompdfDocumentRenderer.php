<?php

namespace Modules\Billing\Services;

use Dompdf\FontMetrics;

class DompdfDocumentRenderer
{
    public function render(string $view, array $data, string $label): string
    {
        $pdf=app('dompdf.wrapper');
        $pdf->setOptions([...BillingPdfFonts::options(), 'isRemoteEnabled'=>false, 'isPhpEnabled'=>false, 'isJavascriptEnabled'=>false, 'isFontSubsettingEnabled'=>true, 'chroot'=>storage_path('app/private/billing'), 'allowedProtocols'=>['data://'=>['rules'=>[]]]]);
        $d = $pdf->getDomPDF();
        $d->setFontMetrics(new FontMetrics($d->getCanvas(), $d->getOptions()));
        $pdf->setPaper('a4')->loadView($view, $data)->render();
        $d   =$pdf->getDomPDF();
        $font=$d->getFontMetrics()->getFont('FreeSans');
        $d->getCanvas()->page_text(36, 812, $label, $font, 8, [0.31, 0.31, 0.31]);
        $d->getCanvas()->page_text(470, 812, 'Page {PAGE_NUM} of {PAGE_COUNT}', $font, 8, [0.31, 0.31, 0.31]);

        return $pdf->output();
    }
}
