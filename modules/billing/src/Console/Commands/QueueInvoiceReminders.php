<?php

namespace Modules\Billing\Console\Commands;

use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Modules\Billing\Models\Invoice;
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
        Invoice::where('status', 'issued')->where('reminders_disabled', false)->whereNotNull('due_date')->whereDate('due_date', '<=', $today->addDays(30)->toDateString())->with('payments')->chunkById(100, function ($invoices) use ($today, $settings, &$count) {
            foreach ($invoices as $invoice) {
                if (! app(InvoiceBalance::class)->data($invoice)['can_receive']) {
                    continue;
                }
                $days=(int) CarbonImmutable::parse($invoice->due_date->format('Y-m-d'), $today->timezone)->diffInDays($today);
                if (! in_array($days, $settings->reminder_offsets, true)) {
                    continue;
                }
                $key='reminder:'.$invoice->id.':'.$invoice->due_date->format('Y-m-d').':'.$days;
                $count += app(\Modules\Billing\Services\InvoiceNotifications::class)->queue($invoice, $days > 0 ? 'overdue' : 'due', $key);
            }
        });
        $this->info($count.' invoice reminders queued.');

        return self::SUCCESS;
    }
}
