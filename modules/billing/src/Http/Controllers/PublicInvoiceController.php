<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;
use Modules\Billing\Actions\ManageInvoiceLinks;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Services\InvoicePdf;
use Modules\Billing\Services\InvoicePresentation;
use Symfony\Component\HttpFoundation\HeaderUtils;

class PublicInvoiceController
{
    public function __invoke(Request $request, string $token, ManageInvoiceLinks $links)
    {
        $invoice=$links->resolve($token)->invoice;
        $headers=['Cache-Control'=>'private, no-store, max-age=0', 'X-Robots-Tag'=>'noindex, nofollow, noarchive', 'Referrer-Policy'=>'no-referrer', 'X-Content-Type-Options'=>'nosniff'];
        $request->validate(['pdf'=>['sometimes', 'boolean']]);
        if ($request->boolean('pdf')) {
            try {
                $document=app(InvoicePdf::class)->document($invoice, false);
            } catch (\Throwable $e) {
                report($e);
                abort(503, 'This invoice PDF is temporarily unavailable. Please try again.');
            }

            return response($document['bytes'], 200, [...$headers, 'Content-Type'=>'application/pdf', 'Content-Disposition'=>HeaderUtils::makeDisposition('attachment', $document['name'])]);
        }
        $data                     =Arr::except(app(InvoicePresentation::class)->data($invoice), ['id', 'customer_id', 'version', 'internal_note', 'cancellation_reason']);
        $data['seller_snapshot']  =Arr::except($data['seller_snapshot'], ['logo_media_id']);
        $data['customer_snapshot']=Arr::except($data['customer_snapshot'], ['contacts']);
        $data['items']            =array_map(fn ($item) =>[...Arr::except($item, ['service_id']), 'taxes'=>array_map(fn ($tax) =>Arr::except($tax, ['tax_rate_id']), $item['taxes'])], $data['items']);
        $balance                  =app(InvoiceBalance::class)->data($invoice);

        return Inertia::render('billing::public-invoice', ['invoice'=>$data, 'settlement'=>Arr::only($balance, ['state', 'paid', 'credited', 'balance', 'overdue']), 'checkoutUrl' => app(\Modules\Billing\Settings\BillingProviderSettings::class)->invoice_checkout_enabled && $balance['can_receive'] ? route('billing.public-invoice.checkout', $token) : null, 'pdfUrl'=>route('billing.public-invoice', ['token'=>$token, 'pdf'=>1])])->toResponse($request)->withHeaders($headers);
    }
}
