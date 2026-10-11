<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Billing\Models\Customer;
use Modules\Billing\Services\CustomerStatement;
use Modules\Billing\Services\DompdfDocumentRenderer;
use Modules\Shared\Http\Controllers\BaseController;

class CustomerStatementController extends BaseController
{
    public function __invoke(Request $request, Customer $customer)
    {
        $this->authorize('view', $customer);
        abort_unless($request->user()->hasRole('super-admin') || $request->user()->can('view statement'), 403);
        $today=now(app(\Modules\Billing\Settings\BillingSettings::class)->timezone);
        $data =$request->validate(['from'=>['nullable', 'date_format:Y-m-d'], 'to'=>['nullable', 'date_format:Y-m-d', 'after_or_equal:from'], 'format'=>['nullable', \Illuminate\Validation\Rule::in(['pdf', 'csv'])]]);
        $from =$data['from'] ?? $today->startOfYear()->format('Y-m-d');
        $to   =$data['to'] ?? now(app(\Modules\Billing\Settings\BillingSettings::class)->timezone)->format('Y-m-d');
        abort_if($from > $to, 422, 'Start date must precede end date.');
        $statement=app(CustomerStatement::class)->data($customer, $from, $to);
        if (($data['format'] ?? '') === 'pdf') {
            try {
                $bytes=app(DompdfDocumentRenderer::class)->render('billing::pdf.statement', $statement, 'Account statement');
            } catch (\Throwable $e) {
                report($e);

                return back()->with('billing_message', 'Statement PDF is temporarily unavailable.');
            }

            return response($bytes, 200, ['Content-Type'=>'application/pdf', 'Content-Disposition'=>'attachment; filename="statement-'.$customer->id.'.pdf"', 'Cache-Control'=>'private, no-store', 'X-Content-Type-Options'=>'nosniff']);
        }
        if (($data['format'] ?? '') === 'csv') {
            return response()->streamDownload(function () use ($statement) {
                $stream=fopen('php://output', 'w');
                fwrite($stream, "\xEF\xBB\xBF");
                fputcsv($stream, ['Currency', 'Date', 'Description', 'Debit', 'Credit', 'Balance']);
                foreach ($statement['groups'] as $g) {
                    fputcsv($stream, [$g['currency'], $statement['from'], 'Opening balance', '', '', $g['opening']]);
                    foreach ($g['entries'] as $e) {
                        $description=preg_match('/^[=+@-]/', $e['description']) ? "'".$e['description'] : $e['description'];
                        fputcsv($stream, [$g['currency'], $e['date'], $description, $e['debit'], $e['credit'], $e['balance']]);
                    }fputcsv($stream, [$g['currency'], $statement['to'], 'Closing balance', '', '', $g['closing']]);
                }fclose($stream);
            }, 'statement-'.$customer->id.'.csv', ['Cache-Control'=>'private, no-store']);
        }

        return Inertia::render('billing::statement', ['statement'=>$statement]);
    }
}
