<?php

namespace Modules\Billing\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Modules\Billing\Mail\InvoiceEmail;
use Modules\Billing\Models\InvoiceDelivery;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Settings\Support\EmailConfiguration;

class DeliverInvoice implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public function backoff(): array
    {
        return [30, 120];
    }

    public function __construct(public int $deliveryId) {}

    public function handle(EmailConfiguration $configuration): void
    {
        $delivery = InvoiceDelivery::with('invoice')->findOrFail($this->deliveryId);
        if (in_array($delivery->state, ['sent', 'failed', 'uncertain', 'skipped'], true)) {
            return;
        }
        if ($delivery->state === 'sending') {
            // A worker may have died after SMTP acceptance. Do not blindly send again.
            if ($delivery->started_at?->lt(now()->subSeconds(75))) {
                $delivery->update(['state' => 'uncertain', 'error' => 'Delivery outcome is unknown. Check the provider before explicitly resending.']);
            }

            return;
        }
        if ($delivery->invoice->status !== 'issued' || ($delivery->kind === 'reminder' && (($delivery->snapshot_version !== null && (int) $delivery->snapshot_version !== $delivery->invoice->version) || $delivery->invoice->reminders_disabled || ! app(\Modules\Billing\Settings\BillingAutomationSettings::class)->reminders_enabled || ! app(InvoiceBalance::class)->data($delivery->invoice)['can_receive']))) {
            $delivery->update(['state' => 'skipped', 'error' => 'Invoice is cancelled or no longer eligible.']);

            return;
        }
        $bytes = Storage::disk('local')->get($delivery->pdf_path);
        if (! is_string($bytes) || ! hash_equals($delivery->pdf_hash, hash('sha256', $bytes))) {
            $delivery->update(['state' => 'failed', 'error' => 'The saved attachment is unavailable or has changed.']);

            return;
        }
        if (! InvoiceDelivery::whereKey($delivery->id)->where('state', 'queued')->update(['state' => 'sending', 'started_at' => now()])) {
            return;
        }
        $delivery->invoice->refresh();
        if ($delivery->invoice->status !== 'issued' || ($delivery->kind === 'reminder' && (($delivery->snapshot_version !== null && (int) $delivery->snapshot_version !== $delivery->invoice->version) || $delivery->invoice->reminders_disabled || ! app(\Modules\Billing\Settings\BillingAutomationSettings::class)->reminders_enabled || ! app(InvoiceBalance::class)->data($delivery->invoice)['can_receive']))) {
            $delivery->update(['state' => 'skipped', 'error' => 'Invoice is no longer eligible.']);

            return;
        }
        try {
            $sent = $configuration->run(fn () => Mail::to($delivery->recipients)->send(new InvoiceEmail($delivery->invoice->formatted_number, $delivery->message ?? '', $delivery->invoice_url, $bytes, $delivery->pdf_name, $delivery->subject)));
            DB::transaction(function () use ($delivery, $sent) {
                $reference = $sent ? substr((string) $sent->getMessageId(), 0, 255) : null;
                $delivery->update(['state' => 'sent', 'sent_at' => now(), 'error' => null, 'provider_reference' => $reference]);
                $delivery->invoice->recordActivity('email_accepted', 'Invoice email attempt #'.$delivery->id.' accepted by the configured transport.');
            });
        } catch (\Throwable $error) {
            report($error);
            $delivery->update(['state' => 'uncertain', 'error' => 'The email delivery outcome could not be confirmed. Check provider history before resending.']);
        }
    }

    public function failed(?\Throwable $error): void
    {
        InvoiceDelivery::whereKey($this->deliveryId)->whereIn('state', ['queued', 'sending'])->update(['state' => 'failed', 'error' => 'Delivery worker failed. Check queue configuration and explicitly resend.']);
    }
}
