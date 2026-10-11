<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Services\InvoicePdf;
use Modules\Shared\Http\Controllers\BaseController;
use Symfony\Component\HttpFoundation\HeaderUtils;

class InvoicePdfController extends BaseController
{
    public function __invoke(Request $request, Invoice $invoice, InvoicePdf $pdf): Response|RedirectResponse
    {
        $this->authorize('view', $invoice);
        $this->authorize('download', $invoice);
        $request->validate(['download' => ['sometimes', 'boolean']]);
        try {
            $document = $pdf->document($invoice, $request->user()->can('view', new \Modules\Billing\Models\Payment));
        } catch (\Throwable $error) {
            report($error);

            return to_route('admin.invoices.show', $invoice)->with('billing_pdf_error', 'The PDF could not be generated. Please try again. If the problem continues, check the saved logo and private storage.');
        }

        return response($document['bytes'], 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => HeaderUtils::makeDisposition($request->boolean('download') ? 'attachment' : 'inline', $document['name']),
            'Cache-Control'       => 'private, no-store, max-age=0', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
