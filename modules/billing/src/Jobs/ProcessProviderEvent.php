<?php

namespace Modules\Billing\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Modules\Billing\Models\ProviderEvent;
use Modules\Billing\Services\ReconcileProviderPayment;

class ProcessProviderEvent implements ShouldQueue
{
    use Queueable;

    public int $tries=3;

    public int $timeout=60;

    public function backoff(): array
    {
        return [30, 120];
    }

    public function __construct(public int $eventId) {}

    public function handle(): void
    {
        $event=ProviderEvent::findOrFail($this->eventId);
        if (in_array($event->state, ['processed', 'ignored', 'needs_review'], true)) {
            return;
        }
        if ($event->event_type !== 'payment.succeeded') {
            $event->update(['state'=>str_starts_with($event->event_type, 'refund.') ? 'needs_review' : 'ignored', 'processed_at'=>now()]);

            return;
        }
        $id=$event->payload['data']['payment_id'] ?? null;
        if (! is_string($id) || $id === '') {
            $event->update(['state'=>'needs_review', 'error'=>'Payment identity is missing.']);

            return;
        }
        $state=app(ReconcileProviderPayment::class)->handle($id, $event->provider, is_string($event->payload['data']['checkout_id'] ?? null) ? $event->payload['data']['checkout_id'] : null);
        $event->update(['state'=>$state === 'unmatched' ? 'ignored' : $state, 'processed_at'=>now()]);
    }

    public function failed(?\Throwable $e): void
    {
        ProviderEvent::whereKey($this->eventId)->update(['state'=>'failed', 'error'=>'Provider reconciliation failed. Retry from reconciliation tools after checking configuration.']);
    }
}
