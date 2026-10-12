<?php

namespace Modules\Billing\Services;

use Illuminate\Support\Facades\DB;
use Modules\Billing\Actions\ManagePayments;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\OnlineCheckout;
use Modules\Billing\Models\Payment;
use Modules\Frontend\Models\ConsultationBooking;
use Modules\Frontend\Services\CalComService;

class ReconcileProviderPayment
{
    public function handle(string $paymentId, string $provider = 'dodo', ?string $checkoutId = null): string
    {
        $registry = app(PaymentGatewayRegistry::class);
        $adapter  = $registry->adapter($provider);
        $context  = $checkoutId ? OnlineCheckout::where('provider', $provider)->where('public_id', $checkoutId)->first() : null;
        $payment  = $adapter instanceof \Modules\Billing\Contracts\CheckoutPaymentProvider && $context
            ? $adapter->paymentForCheckout($paymentId, $context)
            : $adapter->payment($paymentId);
        if (($payment['id'] ?? '') !== $paymentId || ($payment['status'] ?? '') !== 'succeeded') {
            return 'pending';
        }
        if ($payment['refunded'] ?? false) {
            if ($publicId = $payment['metadata']['billing_checkout_id'] ?? null) {
                OnlineCheckout::where('provider', $provider)->where('public_id', $publicId)->update(['state' => 'needs_review', 'payment_id' => $paymentId, 'error' => 'Provider reports a refund. Reconcile the credit/refund ledger before applying this payment.']);
            }

            return 'needs_review';
        }
        if ($publicId=$payment['metadata']['billing_checkout_id'] ?? null) {
            $checkout=OnlineCheckout::where('public_id', $publicId)->firstOrFail();

            return DB::transaction(function () use ($checkout, $payment, $paymentId, $provider) {
                if (DB::connection()->getDriverName() === 'sqlite') {
                    DB::table('billing_invoices')->where('id', $checkout->invoice_id)->update(['version'=>DB::raw('version')]);
                }
                $invoice =Invoice::whereKey($checkout->invoice_id)->lockForUpdate()->firstOrFail();
                $checkout=OnlineCheckout::whereKey($checkout->id)->lockForUpdate()->firstOrFail();
                if (Payment::where('provider', $provider)->where('provider_payment_id', $paymentId)->exists()) {
                    return 'processed';
                }
                if ($checkout->provider !== $provider) {
                    $checkout->update(['state'=>'needs_review', 'error'=>'Verified payment belongs to a different provider than this checkout.']);

                    return 'needs_review';
                }
                if ($checkout->expected_minor !== ($payment['amount'] ?? null) || $checkout->currency !== ($payment['currency'] ?? null)) {
                    $checkout->update(['state'=>'needs_review', 'payment_id'=>$paymentId, 'error'=>'Verified payment amount or currency does not match the invoice checkout.']);

                    return 'needs_review';
                }
                try {
                    app(ManagePayments::class)->record($invoice, ['version'=>$invoice->version, 'request_key'=>$checkout->request_key, 'amount'=>InvoiceCalculator::money((string) $checkout->expected_minor, $invoice->currency_precision), 'currency'=>$checkout->currency, 'payment_date'=>now(app(\Modules\Billing\Settings\BillingSettings::class)->timezone)->format('Y-m-d'), 'method'=>$provider, 'provider'=>$provider, 'provider_payment_id'=>$paymentId], null, true);
                } catch (\Illuminate\Validation\ValidationException|\Symfony\Component\HttpKernel\Exception\HttpException $e) {
                    $checkout->update(['state'=>'needs_review', 'payment_id'=>$paymentId, 'error'=>'Payment was verified but could not be applied. Review the current invoice balance and lifecycle.']);

                    return 'needs_review';
                }
                $checkout->update(['state'=>'paid', 'payment_id'=>$paymentId, 'error'=>null]);

                return 'processed';
            }, 5);
        }
        if ($provider !== 'dodo') {
            return 'unmatched';
        }
        $booking=ConsultationBooking::where('payment_id', $paymentId)->first();
        if (! $booking) {
            return 'unmatched';
        }
        if ($booking->expected_amount_minor === null || (int) $booking->expected_amount_minor !== ($payment['amount'] ?? null) || $booking->expected_currency !== ($payment['currency'] ?? null) || (string) $booking->id !== ($payment['metadata']['booking_id'] ?? null)) {
            return 'needs_review';
        }
        if ($booking->fulfillment_state === 'confirmed') {
            return 'processed';
        }
        if (! $booking->isPending() || $booking->fulfillment_state === 'sending' || $booking->fulfillment_state === 'uncertain') {
            return 'needs_review';
        }
        if (! ConsultationBooking::whereKey($booking->id)->whereIn('fulfillment_state', ['unverified', 'pending'])->update(['fulfillment_state'=>'sending', 'paid_at'=>now()])) {
            return 'needs_review';
        }
        try {
            $result=app(CalComService::class)->createBooking($booking->slot_start->toISOString(), $booking->name, $booking->email, $booking->timezone, ['payment_id'=>$paymentId, 'booking_id'=>(string) $booking->id]);
            if (empty($result['uid'])) {
                throw new \RuntimeException('Calendar booking did not return an identity.');
            }$booking->markConfirmed($result['uid'], $result);
            $booking->update(['fulfillment_state'=>'confirmed']);

            return 'processed';
        } catch (\Throwable $e) {
            report($e);
            $booking->update(['fulfillment_state'=>'uncertain']);

            return 'needs_review';
        }
    }
}
