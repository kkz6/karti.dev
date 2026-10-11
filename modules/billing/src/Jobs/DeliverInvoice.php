<?php

namespace Modules\Billing\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Modules\Billing\Exceptions\SmsDeliveryException;
use Modules\Billing\Mail\InvoiceEmail;
use Modules\Billing\Models\InvoiceDelivery;
use Modules\Billing\Models\Payment;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Services\SmsDelivery;
use Modules\Billing\Settings\BillingAutomationSettings;
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

    private function eligible(InvoiceDelivery $delivery): bool
    {
        if ($delivery->invoice->status !== 'issued') {
            return false;
        }
        if (in_array($delivery->kind, ['reminder', 'payment'], true) && array_diff($delivery->recipients, \Modules\Billing\Support\NotificationRecipients::for($delivery->invoice, $delivery->channel))) {
            return false;
        }
        $settings = app(BillingAutomationSettings::class);
        if ($delivery->kind === 'reminder') {
            return ($delivery->snapshot_version === null || (int) $delivery->snapshot_version === $delivery->invoice->version)
                && ! $delivery->invoice->reminders_disabled && $settings->reminders_enabled
                && ($delivery->channel === 'sms' ? $settings->reminder_sms : $settings->reminder_email)
                && app(InvoiceBalance::class)->data($delivery->invoice)['can_receive'];
        }
        if ($delivery->kind === 'payment') {
            return ($delivery->channel === 'sms' ? $settings->receipt_sms : $settings->receipt_email)
                && Payment::whereKey($delivery->payment_id)->where('invoice_id', $delivery->invoice_id)->whereNull('reversed_at')->exists();
        }

        return true;
    }

    public function handle(EmailConfiguration $configuration): void
    {
        app()->forgetInstance(BillingAutomationSettings::class);
        $delivery = InvoiceDelivery::with('invoice')->findOrFail($this->deliveryId);
        if (in_array($delivery->state, ['sent', 'failed', 'uncertain', 'skipped'], true)) {
            return;
        }
        if ($delivery->state === 'sending') {
            if ($delivery->started_at?->lt(now()->subSeconds(75))) {
                $delivery->update(['state' => 'uncertain', 'error' => 'Delivery outcome is unknown. Check the provider before explicitly resending.']);
            }

            return;
        }
        if (! $this->eligible($delivery)) {
            $delivery->update(['state' => 'skipped', 'error' => 'Invoice or notification is no longer eligible.']);

            return;
        }
        $bytes = null;
        if ($delivery->channel === 'email') {
            $bytes = Storage::disk('local')->get($delivery->pdf_path);
            if (! is_string($bytes) || ! hash_equals($delivery->pdf_hash, hash('sha256', $bytes))) {
                $delivery->update(['state' => 'failed', 'error' => 'The saved attachment is unavailable or has changed.']);

                return;
            }
        }
        if (! InvoiceDelivery::whereKey($delivery->id)->where('state', 'queued')->update(['state' => 'sending', 'started_at' => now()])) {
            return;
        }
        $delivery->invoice->refresh();
        if (! $this->eligible($delivery)) {
            $delivery->update(['state' => 'skipped', 'error' => 'Invoice or notification is no longer eligible.']);

            return;
        }
        try {
            if ($delivery->channel === 'sms') {
                $reference = app(SmsDelivery::class)->send($delivery->provider, $delivery->recipients[0], $delivery->message, $delivery->provider_payload ?? []);
            } else {
                $sent      = $configuration->run(fn () => Mail::to($delivery->recipients)->send(new InvoiceEmail($delivery->invoice->formatted_number, $delivery->message ?? '', $delivery->invoice_url, $bytes, $delivery->pdf_name, $delivery->subject)));
                $reference = $sent ? substr((string) $sent->getMessageId(), 0, 255) : null;
            }
            DB::transaction(function () use ($delivery, $reference) {
                $delivery->update(['state' => 'sent', 'sent_at' => now(), 'error' => null, 'provider_reference' => $reference]);
                $delivery->invoice->recordActivity($delivery->channel.'_accepted', 'Invoice '.$delivery->channel.' attempt #'.$delivery->id.' accepted by the configured provider.');
            });
        } catch (SmsDeliveryException $error) {
            $delivery->update(['state' => $error->uncertain ? 'uncertain' : 'failed', 'error' => $error->getMessage()]);
        } catch (\Throwable $error) {
            // Provider exceptions can include credentials; expose only a generic outcome.
            $delivery->update(['state' => 'uncertain', 'error' => 'Delivery outcome could not be confirmed. Check provider history before resending.']);
        }
    }

    public function failed(?\Throwable $error): void
    {
        InvoiceDelivery::whereKey($this->deliveryId)->where('state', 'queued')->update(['state' => 'failed', 'error' => 'Delivery worker failed. Check queue configuration and explicitly resend.']);
        InvoiceDelivery::whereKey($this->deliveryId)->where('state', 'sending')->update(['state' => 'uncertain', 'error' => 'Delivery worker stopped during sending. Check provider history before resending.']);
    }
}
