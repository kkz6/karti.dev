<?php

namespace Modules\Billing\Services;

use Brick\Math\BigInteger;
use Carbon\CarbonImmutable;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Billing\Settings\BillingSettings;

class InvoiceBalance
{
    public function paidMinor(Invoice $invoice): BigInteger
    {
        $invoice->loadMissing('payments');
        $paid = BigInteger::zero();
        foreach ($invoice->payments as $payment) {
            if ($payment->reversed_at === null) {
                $paid = $paid->plus($payment->amount_minor);
            }
        }

        return $paid;
    }

    public function creditedMinor(Invoice $invoice): BigInteger
    {
        $invoice->loadMissing('creditAllocations.creditNote');
        $sum=BigInteger::zero();
        foreach ($invoice->creditAllocations as $a) {
            if (! $a->reversed_at && $a->creditNote->status === 'issued') {
                $sum=$sum->plus($a->amount_minor);
            }
        }

        return $sum;
    }

    public function data(Invoice $invoice): array
    {
        $paid      = $this->paidMinor($invoice);
        $credited  = $this->creditedMinor($invoice);
        $remaining = BigInteger::of($invoice->total_minor)->minus($paid)->minus($credited);
        $state     = $invoice->status !== 'issued' ? $invoice->status : ($remaining->isZero() ? ($credited->isPositive() ? 'settled' : 'paid') : ($paid->isZero() && $credited->isZero() ? 'unpaid' : 'partial'));
        $today     = CarbonImmutable::now(app(BillingSettings::class)->timezone)->format('Y-m-d');

        return [
            'credited'    => InvoiceCalculator::money((string) $credited, $invoice->currency_precision),
            'state'       => $state, 'paid' => InvoiceCalculator::money((string) $paid, $invoice->currency_precision),
            'balance'     => InvoiceCalculator::money((string) $remaining, $invoice->currency_precision),
            'overdue'     => $invoice->status === 'issued' && $remaining->isPositive() && $invoice->due_date && $invoice->due_date->format('Y-m-d') < $today,
            'can_receive' => $invoice->status === 'issued' && $remaining->isPositive(),
        ];
    }

    public function paymentData(Payment $payment): array
    {
        return [...$payment->only(['id', 'currency', 'method_label', 'reference', 'notes', 'actor_name', 'reversed_by_name', 'reversal_reason']),
            'amount'       => InvoiceCalculator::money((string) $payment->amount_minor, $payment->currency_precision),
            'payment_date' => $payment->payment_date->format('Y-m-d'), 'created_at' => $payment->created_at->toIso8601String(), 'reversed_at' => $payment->reversed_at?->toIso8601String()];
    }

    public function customerData(int $customerId, bool $includePayments): array
    {
        $invoices = Invoice::where('customer_id', $customerId)->with(['payments', 'creditAllocations.creditNote'])->orderByDesc('id')->get();
        $groups   = [];
        $history  = [];
        $payments = [];
        foreach ($invoices as $invoice) {
            $balance   = $this->data($invoice);
            $history[] = ['id' => $invoice->id, 'number' => $invoice->formatted_number ?? 'Draft #'.$invoice->id, 'status' => $invoice->status, 'currency' => $invoice->currency, 'total' => InvoiceCalculator::money((string) $invoice->total_minor, $invoice->currency_precision), 'due_date' => $invoice->due_date?->format('Y-m-d'), 'settlement' => $balance];
            if ($invoice->status === 'issued') {
                $key = $invoice->currency.'|'.$invoice->currency_precision;
                $groups[$key] ??= ['currency' => $invoice->currency, 'precision' => $invoice->currency_precision, 'invoiced' => BigInteger::zero(), 'paid' => BigInteger::zero(), 'credited' => BigInteger::zero(), 'available_credit' => BigInteger::zero(), 'refunds' => BigInteger::zero(), 'net_balance' => BigInteger::zero(), 'balance' => BigInteger::zero(), 'overdue' => BigInteger::zero()];
                $paid                     = $this->paidMinor($invoice);
                $credited                 = $this->creditedMinor($invoice);
                $remaining                = BigInteger::of($invoice->total_minor)->minus($paid)->minus($credited);
                $groups[$key]['invoiced'] = $groups[$key]['invoiced']->plus($invoice->total_minor);
                $groups[$key]['paid']     = $groups[$key]['paid']->plus($paid);
                $groups[$key]['credited'] = $groups[$key]['credited']->plus($credited);
                $groups[$key]['balance']  = $groups[$key]['balance']->plus($remaining);
                if ($balance['overdue']) {
                    $groups[$key]['overdue'] = $groups[$key]['overdue']->plus($remaining);
                }
            }
            if ($includePayments) {
                foreach ($invoice->payments as $payment) {
                    $payments[] = [...$this->paymentData($payment), 'invoice_id' => $invoice->id, 'invoice_number' => $invoice->formatted_number];
                }
            }
        }
        foreach (\Modules\Billing\Models\CreditNote::where('customer_id', $customerId)->where('status', 'issued')->with(['allocations', 'refunds'])->get() as $note) {
            $key = $note->currency.'|'.$note->currency_precision;
            if (isset($groups[$key])) {
                $groups[$key]['available_credit'] = $groups[$key]['available_credit']->plus(app(CreditBalance::class)->available($note));
                $groups[$key]['refunds']          = $groups[$key]['refunds']->plus(app(CreditBalance::class)->refunded($note));
            }
        }
        foreach ($groups as &$group) {
            $group['net_balance'] = $group['balance']->minus($group['available_credit']);
            foreach (['invoiced', 'paid', 'credited', 'available_credit', 'refunds', 'net_balance', 'balance', 'overdue'] as $field) {
                $group[$field] = InvoiceCalculator::money((string) $group[$field], $group['precision']);
            }
        }
        usort($payments, fn ($a, $b) => $b['id'] <=> $a['id']);

        return ['totals' => array_values($groups), 'invoices' => $history, 'payments' => $includePayments ? $payments : null];
    }
}
