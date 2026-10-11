<?php

namespace Modules\Billing\Console\Commands;

use Illuminate\Console\Command;
use Modules\Billing\Contracts\PaymentProvider;
use Modules\Billing\Jobs\ProcessProviderEvent;
use Modules\Billing\Models\OnlineCheckout;
use Modules\Billing\Models\ProviderEvent;
use Modules\Billing\Services\ReconcileProviderPayment;
use Modules\Frontend\Models\ConsultationBooking;

class ReconcileOnlinePayments extends Command
{
    protected $signature='billing:reconcile-payments';

    protected $description='Recover pending verified payments and failed event processing';

    public function handle(): int
    {
        $count=0;
        foreach (OnlineCheckout::where('state', 'pending')->whereNotNull('session_id')->limit(100)->get() as $checkout) {
            try {
                $id=app(PaymentProvider::class)->checkoutPaymentId($checkout->session_id);
                if ($id) {
                    app(ReconcileProviderPayment::class)->handle($id);
                    $count++;
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }
        foreach (ConsultationBooking::where('status', 'pending')->whereNotNull('payment_id')->whereNotNull('expected_amount_minor')->limit(100)->get() as $booking) {
            try {
                app(ReconcileProviderPayment::class)->handle($booking->payment_id);
            } catch (\Throwable $e) {
                report($e);
            }
        }
        foreach (ProviderEvent::whereIn('state', ['pending', 'failed'])->limit(100)->get() as $event) {
            ProcessProviderEvent::dispatch($event->id)->onQueue('billing');
        }$this->info($count.' online checkout payments checked.');

        return self::SUCCESS;
    }
}
