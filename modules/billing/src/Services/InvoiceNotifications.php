<?php

namespace Modules\Billing\Services;

use Illuminate\Support\Str;
use Modules\Billing\Actions\QueueInvoiceDelivery;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Billing\Settings\BillingAutomationSettings;
use Modules\Billing\Settings\BillingDeliverySettings;

class InvoiceNotifications
{
    public function queue(Invoice $invoice, string $event, string $key, ?Payment $payment = null): int
    {
        $automation = app(BillingAutomationSettings::class);
        $settings   = app(BillingDeliverySettings::class);
        $template   = $settings->resolvedTemplates()[$event];
        $receipt    = $event === 'payment';
        $attempts   = [];
        if ($receipt ? $automation->receipt_email : $automation->reminder_email) {
            $recipients = \Modules\Billing\Support\NotificationRecipients::for($invoice, 'email');
            if ($recipients) {
                $attempts[] = ['channel' => 'email', 'recipients' => $recipients, 'occurrence_key' => $key];
            }
        }
        if ($settings->sms_enabled && ($receipt ? $automation->receipt_sms : $automation->reminder_sms)) {
            $phones = \Modules\Billing\Support\NotificationRecipients::for($invoice, 'sms');
            foreach ($phones as $phone) {
                $attempts[] = ['channel' => 'sms', 'recipients' => [$phone], 'occurrence_key' => $key.':sms:'.substr(hash('sha256', $phone), 0, 16)];
            }
        }
        $count = 0;
        foreach ($attempts as $attempt) {
            if (\Modules\Billing\Models\InvoiceDelivery::where('occurrence_key', $attempt['occurrence_key'])->exists()) {
                continue;
            }
            try {
                app(QueueInvoiceDelivery::class)->handle($invoice, [
                    ...$attempt, 'request_key' => (string) Str::uuid(), 'event' => $event,
                    'kind'    => $receipt ? 'payment' : 'reminder', 'payment_id' => $payment?->id,
                    'subject' => $template['email_subject'], 'message' => $template[$attempt['channel'] === 'sms' ? 'sms_message' : 'email_message'],
                ]);
                $count++;
            } catch (\Throwable) {
                // Channel failures must not undo a payment or block other recipients.
                $invoice->recordActivity('notification_failed', 'Could not queue '.$attempt['channel'].' '.$event.' notice. Check delivery settings and recipient details.');
            }
        }

        return $count;
    }
}
