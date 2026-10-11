<?php

namespace Modules\Billing\Console\Commands;

use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Str;
use Modules\Billing\Actions\QueueInvoiceDelivery;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\InvoiceDelivery;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Settings\BillingAutomationSettings;
use Modules\Billing\Settings\BillingSettings;

class QueueInvoiceReminders extends Command
{
    protected $signature='billing:reminders';

    protected $description='Queue one due-date reminder per configured offset and invoice';

    public function handle(): int
    {
        $settings=app(BillingAutomationSettings::class);
        if (! $settings->reminders_enabled) {
            $this->info('Invoice reminders are disabled.');

            return self::SUCCESS;
        }
        $today=CarbonImmutable::now(app(BillingSettings::class)->timezone)->startOfDay();
        $count=0;
        Invoice::where('status', 'issued')->where('reminders_disabled', false)->whereNotNull('due_date')->whereDate('due_date', '<=', $today->toDateString())->with('payments')->chunkById(100, function ($invoices) use ($today, $settings, &$count) {
            foreach ($invoices as $invoice) {
                if (! app(InvoiceBalance::class)->data($invoice)['can_receive']) {
                    continue;
                }
                $days=(int) CarbonImmutable::parse($invoice->due_date->format('Y-m-d'), $today->timezone)->diffInDays($today);
                if (! in_array($days, $settings->reminder_offsets, true)) {
                    continue;
                }
                $key='reminder:'.$invoice->id.':'.$invoice->due_date->format('Y-m-d').':'.$days;
                if (InvoiceDelivery::where('occurrence_key', $key)->exists()) {
                    continue;
                }
                $recipients=array_values(array_unique(array_filter(array_column($invoice->customer_snapshot['contacts'] ?? [], 'email'))));
                if (! $recipients) {
                    continue;
                }
                try {
                    app(QueueInvoiceDelivery::class)->handle($invoice, ['request_key'=>(string) Str::uuid(), 'kind'=>'reminder', 'occurrence_key'=>$key, 'recipients'=>$recipients, 'subject'=>'Payment reminder: '.$invoice->formatted_number, 'message'=>'Your invoice is due for payment. Please see the attached invoice for the current amount due.']);
                    $count++;
                } catch (\Throwable $e) {
                    report($e);
                    $this->error('Unable to queue reminder for invoice '.$invoice->id.'.');
                }
            }
        });
        $this->info($count.' invoice reminders queued.');

        return self::SUCCESS;
    }
}
