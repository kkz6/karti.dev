<?php

namespace Modules\Billing\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\Billing\Contracts\PaymentProvider;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\OnlineCheckout;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Settings\BillingProviderSettings;

class CreateInvoiceCheckout
{
    public function handle(Invoice $invoice, string $requestKey, string $invoiceUrl): OnlineCheckout
    {
        $settings=app(BillingProviderSettings::class);
        abort_unless($settings->invoice_checkout_enabled && $settings->document_policy_confirmed && $settings->invoice_product_id !== '', 409, 'Invoice online checkout is not configured.');
        $checkout=DB::transaction(function () use ($invoice, $requestKey, $invoiceUrl) {
            if (DB::connection()->getDriverName() === 'sqlite') {
                DB::table('billing_invoices')->where('id', $invoice->id)->update(['version'=>DB::raw('version')]);
            }
            $locked    =Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            $balance   =app(InvoiceBalance::class);
            abort_if($locked->invoice_date->format('Y-m-d') > now(app(\Modules\Billing\Settings\BillingSettings::class)->timezone)->format('Y-m-d'), 409, 'Payment can begin on the invoice date.');
            $settlement=$balance->data($locked);
            abort_unless($settlement['can_receive'], 409, 'This invoice has no payable balance.');
            $minor   =(string) \Brick\Math\BigInteger::of($locked->total_minor)->minus($balance->paidMinor($locked))->minus($balance->creditedMinor($locked));
            $existing=OnlineCheckout::where('invoice_id', $locked->id)->whereIn('state', ['creating', 'pending'])->where('expected_minor', $minor)->first();
            if ($existing) {
                return $existing;
            }
            $used=OnlineCheckout::where('request_key', $requestKey)->first();
            if ($used) {
                throw ValidationException::withMessages(['checkout'=>'Reopen the invoice before starting another checkout.']);
            }

            return OnlineCheckout::create(['invoice_id'=>$locked->id, 'public_id'=>(string) Str::uuid(), 'request_key'=>$requestKey, 'expected_minor'=>$minor, 'currency'=>$locked->currency, 'invoice_url'=>$invoiceUrl]);
        }, 5);
        if ($checkout->state === 'pending') {
            return $checkout;
        }
        try {
            $result=app(PaymentProvider::class)->invoiceCheckout($checkout);
            $checkout->update(['session_id'=>$result['session_id'], 'checkout_url'=>$result['url'], 'state'=>'pending', 'error'=>null]);
        } catch (\Throwable $e) {
            report($e);
            $checkout->update(['error'=>'Checkout could not be prepared. Try again with the same invoice.']);
            throw ValidationException::withMessages(['checkout'=>'Checkout could not be prepared. Check the configured product, currency and provider availability.']);
        }

        return $checkout->refresh();
    }
}
