<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\Request;
use Modules\Billing\Jobs\ProcessProviderEvent;
use Modules\Billing\Models\ProviderEvent;

class ProviderWebhookController
{
    public function __invoke(Request $request)
    {
        abort_if(strlen($request->getContent()) > 1024 * 1024, 413);
        $secret=config('services.dodo_payments.webhook_key');
        abort_unless(is_string($secret) && $secret !== '', 503, 'Webhook verification is not configured.');
        try {
            (new \StandardWebhooks\Webhook($secret))->verify($request->getContent(), ['webhook-id'=>$request->header('webhook-id', ''), 'webhook-timestamp'=>$request->header('webhook-timestamp', ''), 'webhook-signature'=>$request->header('webhook-signature', '')]);
            $data=json_decode($request->getContent(), true, 64, JSON_THROW_ON_ERROR);
        } catch (\Throwable) {
            abort(401, 'Invalid webhook signature or payload.');
        }
        $id=$request->header('webhook-id');
        abort_unless(is_string($id) && strlen($id) <= 255 && is_string($data['type'] ?? null), 400);
        $event=ProviderEvent::firstOrCreate(['event_id'=>$id], ['event_type'=>$data['type'], 'payload'=>$data]);
        if (in_array($event->state, ['pending', 'failed'], true)) {
            ProcessProviderEvent::dispatch($event->id)->onQueue('billing');
        }

        return response()->json(['received'=>true]);
    }
}
