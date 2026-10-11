<?php

namespace Modules\Billing\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\IssueInvoice;
use Modules\Billing\Actions\QueueInvoiceDelivery;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\RecurringInvoice;

class RecurringInvoiceGenerator
{
    public static function template(Invoice $invoice): array
    {
        $data         =Arr::only(app(InvoicePresentation::class)->data($invoice), ['customer_id', 'currency', 'discount_mode', 'discount_value', 'customer_note', 'internal_note', 'terms', 'payment_instructions', 'items']);
        $data['items']=array_map(function ($item) {
            $item              =Arr::only($item, ['key', 'description', 'additional_description', 'unit', 'quantity', 'rate', 'taxes']);
            $item['service_id']=null;
            $item['taxes']     =array_map(fn ($tax) =>['tax_rate_id'=>null, 'name'=>$tax['name'], 'percentage'=>$tax['percentage']], $item['taxes']);

            return $item;
        }, $data['items']);

        return $data;
    }

    public function generate(int $id): ?Invoice
    {
        return DB::transaction(function () use ($id) {
            if (DB::connection()->getDriverName() === 'sqlite') {
                DB::table('billing_recurring_invoices')->where('id', $id)->update(['version'=>DB::raw('version')]);
            }
            $schedule=RecurringInvoice::whereKey($id)->lockForUpdate()->firstOrFail();
            if (! $schedule->active || $schedule->next_date->format('Y-m-d') > CarbonImmutable::now($schedule->timezone)->format('Y-m-d')) {
                return null;
            }
            if ($schedule->cycle_limit !== null && $schedule->cycles_done >= $schedule->cycle_limit) {
                $schedule->update(['active'=>false]);

                return null;
            }
            $date=$schedule->next_date->format('Y-m-d');
            if (DB::table('billing_recurrence_occurrences')->where('recurring_invoice_id', $id)->where('scheduled_date', $date)->whereNotNull('invoice_id')->exists()) {
                return null;
            }
            $actor =User::find($schedule->actor_id);
            $source=Invoice::findOrFail($schedule->source_invoice_id);
            if ($source->status === 'cancelled') {
                $schedule->update(['active' => false, 'last_error' => 'The source invoice was cancelled. Review the schedule before generating more invoices.']);

                return null;
            }
            if (! $actor || ! $actor->can('create', Invoice::class) || ! $actor->can('view', $source)) {
                throw new \RuntimeException('The schedule owner no longer has invoice access.');
            }
            $data   =[...$schedule->template, 'invoice_date'=>$date, 'due_date'=>CarbonImmutable::parse($date)->addDays($schedule->due_days)->format('Y-m-d')];
            $invoice=app(SaveInvoiceDraft::class)->handle($data);
            if ($schedule->policy !== 'draft') {
                if (! $actor->can('issue', $invoice)) {
                    throw new \RuntimeException('The schedule owner cannot issue invoices.');
                }
                $review =app(InvoiceIssueReview::class)->prepare($invoice, true, true);
                $invoice=app(IssueInvoice::class)->handle($invoice, ['version'=>$invoice->version, 'review_token'=>$review['token'], 'refresh_seller'=>true, 'refresh_customer'=>true], $actor);
            }
            if ($schedule->policy === 'issue_and_send') {
                if (! $actor->can('send', $invoice)) {
                    throw new \RuntimeException('The schedule owner cannot send invoices.');
                }
                $recipients=array_values(array_filter(array_column($invoice->customer_snapshot['contacts'] ?? [], 'email')));
                if (! $recipients) {
                    throw new \RuntimeException('No invoice recipients are configured.');
                }
                app(QueueInvoiceDelivery::class)->handle($invoice, ['request_key'=>(string) Str::uuid(), 'recipients'=>$recipients, 'subject'=>'Invoice '.$invoice->formatted_number, 'message'=>'Your recurring invoice is attached.'], $actor);
            }
            DB::table('billing_recurrence_occurrences')->updateOrInsert(['recurring_invoice_id'=>$id, 'scheduled_date'=>$date], ['invoice_id'=>$invoice->id, 'state'=>'created', 'error'=>null, 'created_at'=>now(), 'updated_at'=>now()]);
            $schedule->cycles_done++;
            $anchor             =CarbonImmutable::parse($schedule->anchor_date->format('Y-m-d'), $schedule->timezone);
            $n                  =$schedule->every * $schedule->cycles_done;
            $schedule->next_date=match ($schedule->interval) {
                'day'=> $anchor->addDays($n),'week'=>$anchor->addWeeks($n),'month'=>$anchor->addMonthsNoOverflow($n),'year'=>$anchor->addYearsNoOverflow($n)
            };
            if ($schedule->cycle_limit !== null && $schedule->cycles_done >= $schedule->cycle_limit) {
                $schedule->active=false;
            }
            $schedule->last_error=null;
            $schedule->version++;
            $schedule->save();
            $invoice->recordActivity('recurring_created', 'Generated from recurring schedule #'.$id.' for '.$date.'.', $actor);

            return $invoice;
        }, 5);
    }
}
