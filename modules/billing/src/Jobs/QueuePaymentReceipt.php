<?php

namespace Modules\Billing\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Modules\Billing\Models\Payment;
use Modules\Billing\Services\InvoiceNotifications;
use Modules\Billing\Settings\BillingAutomationSettings;
use Modules\Billing\Settings\BillingDeliverySettings;

class QueuePaymentReceipt implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(public int $paymentId) {}

    public function handle(InvoiceNotifications $notifications): void
    {
        app()->forgetInstance(BillingAutomationSettings::class);
        app()->forgetInstance(BillingDeliverySettings::class);
        $payment = Payment::with('invoice')->findOrFail($this->paymentId);
        if ($payment->reversed_at || $payment->invoice->status !== 'issued') {
            return;
        }
        $notifications->queue($payment->invoice, 'payment', 'payment:'.$payment->id, $payment);
    }
}
