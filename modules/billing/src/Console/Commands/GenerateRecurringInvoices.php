<?php

namespace Modules\Billing\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Modules\Billing\Models\RecurringInvoice;
use Modules\Billing\Services\RecurringInvoiceGenerator;

class GenerateRecurringInvoices extends Command
{
    protected $signature='billing:recurring';

    protected $description='Generate up to twelve overdue schedule occurrences per schedule';

    public function handle(): int
    {
        $count=0;
        RecurringInvoice::where('active', true)->chunkById(100, function ($schedules) use (&$count) {
            foreach ($schedules as $schedule) {
                for ($i=0; $i < 12; $i++) {
                    $schedule->refresh();
                    $attemptDate = $schedule->next_date->format('Y-m-d');
                    try {
                        $invoice=app(RecurringInvoiceGenerator::class)->generate($schedule->id);
                        if (! $invoice) {
                            break;
                        }$count++;
                    } catch (\Throwable $e) {
                        report($e);
                        $message=$e instanceof \Illuminate\Validation\ValidationException ? collect($e->errors())->flatten()->first() : 'Generation failed. Review the owner permissions, customer, issuer and schedule policy.';
                        if (DB::table('billing_recurrence_occurrences')->where('recurring_invoice_id', $schedule->id)->where('scheduled_date', $attemptDate)->whereNotNull('invoice_id')->exists()) {
                            continue;
                        }
                        $schedule->update(['last_error'=>$message]);
                        DB::table('billing_recurrence_occurrences')->updateOrInsert(['recurring_invoice_id'=>$schedule->id, 'scheduled_date'=>$attemptDate], ['state'=>'failed', 'error'=>$message, 'created_at'=>now(), 'updated_at'=>now()]);
                        break;
                    }
                }
            }
        });
        $this->info($count.' recurring invoices generated.');

        return self::SUCCESS;
    }
}
