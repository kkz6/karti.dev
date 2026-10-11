<?php

namespace Modules\Billing\Services;

use Brick\Math\BigInteger;
use Carbon\CarbonImmutable;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Billing\Settings\BillingSettings;

class BillingDashboard
{
    public function __construct(private readonly InvoiceBalance $balances) {}

    public function get(int $days = 30, bool $includeDrafts = false): array
    {
        $timezone = app(BillingSettings::class)->timezone;
        $today    = CarbonImmutable::now($timezone)->toDateString();
        $start    = CarbonImmutable::now($timezone)->subDays($days - 1)->toDateString();
        $counts   = ['issued' => 0, 'drafts' => Invoice::where('status', 'draft')->count(), 'outstanding' => 0, 'overdue' => 0];
        $groups   = [];

        Invoice::whereIn('status', $includeDrafts ? ['issued', 'draft'] : ['issued'])->with(['payments', 'creditAllocations.creditNote'])->chunkById(200, function ($invoices) use (&$groups, &$counts, $today) {
            foreach ($invoices as $invoice) {
                $key = $invoice->currency.'|'.$invoice->currency_precision;
                $groups[$key] ??= $this->group($invoice->currency, $invoice->currency_precision);
                if ($invoice->status === 'draft') {
                    $groups[$key]['drafts'] = $groups[$key]['drafts']->plus($invoice->total_minor);
                    $groups[$key]['counts']['drafts']++;
                    continue;
                }
                $groups[$key]['paid'] = $groups[$key]['paid']->plus($this->balances->paidMinor($invoice));
                $groups[$key]['counts']['issued']++;
                $remaining                = BigInteger::of($invoice->total_minor)->minus($this->balances->paidMinor($invoice))->minus($this->balances->creditedMinor($invoice));
                $groups[$key]['invoiced'] = $groups[$key]['invoiced']->plus($invoice->total_minor);
                $counts['issued']++;
                if ($remaining->isPositive()) {
                    $groups[$key]['outstanding'] = $groups[$key]['outstanding']->plus($remaining);
                    $counts['outstanding']++;
                    $groups[$key]['counts']['outstanding']++;
                    if ($invoice->due_date && $invoice->due_date->format('Y-m-d') < $today) {
                        $groups[$key]['overdue'] = $groups[$key]['overdue']->plus($remaining);
                        $counts['overdue']++;
                        $groups[$key]['counts']['overdue']++;
                    }
                }
            }
        });

        Payment::whereNull('reversed_at')->whereBetween('payment_date', [$start, $today])->chunkById(200, function ($payments) use (&$groups) {
            foreach ($payments as $payment) {
                $key = $payment->currency.'|'.$payment->currency_precision;
                $groups[$key] ??= $this->group($payment->currency, $payment->currency_precision);
                $groups[$key]['collected'] = $groups[$key]['collected']->plus($payment->amount_minor);
            }
        });
        ksort($groups);
        foreach ($groups as &$group) {
            foreach (['invoiced', 'outstanding', 'overdue', 'collected', 'paid', 'drafts'] as $field) {
                $group[$field] = InvoiceCalculator::money((string) $group[$field], $group['precision']);
            }
        }

        return ['counts' => $counts, 'currencies' => array_values($groups), 'period' => ['days' => $days, 'from' => $start, 'to' => $today, 'timezone' => $timezone]];
    }

    private function group(string $currency, int $precision): array
    {
        return ['counts' => ['issued' => 0, 'drafts' => 0, 'outstanding' => 0, 'overdue' => 0], 'paid' => BigInteger::zero(), 'drafts' => BigInteger::zero(), 'currency' => $currency, 'precision' => $precision, 'invoiced' => BigInteger::zero(), 'outstanding' => BigInteger::zero(), 'overdue' => BigInteger::zero(), 'collected' => BigInteger::zero()];
    }
}
