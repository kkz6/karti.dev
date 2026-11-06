<?php

namespace Modules\Billing\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

class InvoiceDeliveryUpdated implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public int $invoiceId) {}

    public static function enabled(): bool
    {
        return ! in_array(config('broadcasting.default'), [null, 'null', 'log'], true);
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('billing.invoices.'.$this->invoiceId)];
    }

    public function broadcastAs(): string
    {
        return 'invoice.delivery.updated';
    }

    public function broadcastWith(): array
    {
        return ['invoiceId' => $this->invoiceId];
    }
}
