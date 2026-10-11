<?php

namespace Modules\Billing\Services;

use Modules\Billing\Contracts\InvoicePdfRenderer;

class DompdfInvoiceRenderer implements InvoicePdfRenderer
{
    public function render(array $data): string
    {
        return app(DompdfDocumentRenderer::class)->render('billing::pdf.invoice', $data, $data['label']);
    }
}
