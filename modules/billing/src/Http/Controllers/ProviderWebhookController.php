<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\Request;
use Modules\Billing\Jobs\ProcessProviderEvent;
use Modules\Billing\Models\ProviderEvent;
use Modules\Billing\Services\PaymentGatewayRegistry;

class ProviderWebhookController
{
    public function __invoke(Request $request, ?string $provider = null)
    {
        $provider ??= 'dodo';
        $registry = app(PaymentGatewayRegistry::class);
        abort_unless(isset($registry->all()[$provider]), 404);
        abort_if(strlen($request->getContent()) > 1024 * 1024, 413);
        // Disabled drivers still verify already-paid checkouts. They cannot create new ones.
        $data = $registry->get($provider)->verifyWebhook($request);
        abort_unless(is_string($data['event_id'] ?? null) && $data['event_id'] !== '' && strlen($data['event_id']) <= 255 && is_string($data['event_type'] ?? null) && strlen($data['event_type']) <= 255 && is_array($data['payload'] ?? null), 400);
        $event = ProviderEvent::firstOrCreate(['provider' => $provider, 'event_id' => $data['event_id']], ['event_type' => $data['event_type'], 'payload' => $data['payload']]);
        if (in_array($event->state, ['pending', 'failed'], true)) {
            ProcessProviderEvent::dispatch($event->id)->onQueue('billing');
        }

        return response()->json(['received' => true]);
    }
}
