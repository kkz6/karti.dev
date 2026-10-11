<?php

namespace Modules\Billing\Actions;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Auth\Models\User;
use Modules\Billing\Jobs\DeliverInvoice;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\InvoiceDelivery;
use Modules\Billing\Models\Payment;
use Modules\Billing\Services\InvoicePdf;
use Modules\Billing\Settings\BillingDeliverySettings;
use Modules\Billing\Support\DeliveryTemplates;

class QueueInvoiceDelivery
{
    public function handle(Invoice $invoice, array $input, ?User $actor = null): InvoiceDelivery
    {
        $channel = $input['channel'] ?? 'email';
        abort_unless(in_array($channel, ['email', 'sms'], true), 422);
        $recipients = array_values(array_unique(array_map(fn ($value) => $channel === 'email' ? strtolower(trim($value)) : DeliveryTemplates::phone($value), $input['recipients'])));
        sort($recipients);
        if ($channel === 'sms' && (count($recipients) !== 1 || $recipients[0] === null)) {
            throw ValidationException::withMessages(['recipients' => 'Choose one phone number in international format, such as +919880952222.']);
        }
        $kind  = $input['kind'] ?? 'invoice';
        $hash  = hash('sha256', json_encode([$invoice->id, $recipients, $input['subject'], $input['message'] ?? '', ...($channel === 'sms' ? ['sms'] : [])], JSON_THROW_ON_ERROR));
        $match = function (InvoiceDelivery $existing) use ($hash, $kind, $channel, $input): InvoiceDelivery {
            if (! hash_equals($existing->request_hash, $hash) || $existing->channel !== $channel || $existing->kind !== $kind || (int) $existing->payment_id !== (int) ($input['payment_id'] ?? 0)) {
                throw ValidationException::withMessages(['request_key' => 'This request key belongs to different delivery details. Reopen the form.']);
            }

            return $existing;
        };
        if ($existing = InvoiceDelivery::where('request_key', $input['request_key'])->first()) {
            return $match($existing);
        }
        abort_unless($invoice->status === 'issued', 409, 'Only issued invoices can be sent.');
        $settings = app(BillingDeliverySettings::class);
        if ($channel === 'sms' && ! $settings->sms_enabled) {
            throw ValidationException::withMessages(['channel' => 'Enable an SMS driver in Billing settings → Delivery first.']);
        }
        $event    = $input['event'] ?? 'invoice';
        $template = $settings->msg91_templates[$event] ?? [];
        if ($channel === 'sms' && $settings->sms_provider === 'msg91' && empty($template['id'])) {
            throw ValidationException::withMessages(['channel' => 'Configure the approved MSG91 template for this notification first.']);
        }
        $document = $channel === 'email' ? app(InvoicePdf::class)->document($invoice, false) : null;

        return DB::transaction(function () use ($invoice, $input, $actor, $recipients, $hash, $document, $channel, $kind, $settings, $template, $match) {
            if (DB::connection()->getDriverName() === 'sqlite') {
                DB::table('billing_invoices')->where('id', $invoice->id)->update(['version' => DB::raw('version')]);
            }
            $locked = Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail();
            if ($existing = InvoiceDelivery::where('request_key', $input['request_key'])->first()) {
                return $match($existing);
            }
            if (($input['occurrence_key'] ?? null) && ($occurrence = InvoiceDelivery::where('occurrence_key', $input['occurrence_key'])->first())) {
                return $occurrence;
            }
            abort_unless($locked->status === 'issued', 409, 'Only issued invoices can be sent.');
            if ($locked->version !== $invoice->version) {
                throw ValidationException::withMessages(['invoice' => 'The invoice changed. Refresh it before sending.']);
            }
            $payment   = isset($input['payment_id']) ? Payment::where('invoice_id', $locked->id)->findOrFail($input['payment_id']) : null;
            $link      = app(ManageInvoiceLinks::class)->create($locked, 90, ucfirst($channel).' delivery', $actor);
            $variables = DeliveryTemplates::variables($locked, $payment, $link['url']);
            $message   = DeliveryTemplates::render($input['message'] ?? '', $variables);
            $subject   = DeliveryTemplates::render($input['subject'], $variables);
            if (preg_match('/[\r\n]/', $subject) || mb_strlen($subject) > 255 || mb_strlen($message) > ($channel === 'sms' ? 1600 : 5000)) {
                throw ValidationException::withMessages(['message' => 'The rendered notification is too long. Shorten the template or message.']);
            }
            $payload = $channel === 'sms' && $settings->sms_provider === 'msg91' ? [
                'template_id' => $template['id'],
                'variables'   => array_map(fn ($field) => $variables[$field], $template['variables'] ?? []),
            ] : null;
            $delivery = InvoiceDelivery::create([
                'invoice_id'       => $locked->id, 'request_key' => $input['request_key'], 'request_hash' => $hash, 'recipients' => $recipients,
                'subject'          => $subject, 'message' => $message, 'channel' => $channel,
                'provider'         => $channel === 'sms' ? $settings->sms_provider : null, 'provider_payload' => $payload,
                'pdf_path'         => $document['path'] ?? '', 'pdf_hash' => $document ? hash('sha256', $document['bytes']) : '', 'pdf_name' => $document['name'] ?? '',
                'snapshot_version' => $locked->version, 'kind' => $kind, 'occurrence_key' => $input['occurrence_key'] ?? null,
                'payment_id'       => $payment?->id, 'actor_id' => $actor?->id, 'actor_name' => $actor?->name ?? 'System', 'invoice_url' => $link['url'],
            ]);
            $locked->recordActivity($channel.'_queued', 'Invoice '.$channel.' queued for '.implode(', ', $recipients).'.', $actor);
            DeliverInvoice::dispatch($delivery->id)->onQueue('billing')->afterCommit();

            return $delivery;
        }, 5);
    }
}
