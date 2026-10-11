<?php

namespace Modules\Billing\Services;

use Brick\Math\BigInteger;
use Modules\Billing\Models\CreditNote;
use Modules\Billing\Models\CreditRefund;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Billing\Settings\BillingSettings;

class CustomerStatement
{
    public function data(Customer $customer, string $from, string $to): array
    {
        $entries =[];
        $timezone=app(BillingSettings::class)->timezone;
        $add     =function (string $date, string $currency, int $precision, string $description, string $amount, string $key) use (&$entries) {
            $entries[]=['date'=>$date, 'currency'=>$currency, 'precision'=>$precision, 'description'=>$description, 'amount'=>BigInteger::of($amount), 'key'=>$key];
        };
        $invoices=Invoice::where('customer_id', $customer->id)->whereNotNull('issued_at')->orderBy('id')->get();
        foreach ($invoices as $i) {
            $date=$i->invoice_date->format('Y-m-d');
            $add($date, $i->currency, $i->currency_precision, 'Invoice '.$i->formatted_number, (string) $i->total_minor, 'invoice:'.$i->id);
            if ($i->cancelled_at) {
                $add(max($date, $i->cancelled_at->copy()->timezone($timezone)->format('Y-m-d')), $i->currency, $i->currency_precision, 'Cancelled invoice '.$i->formatted_number, (string) BigInteger::of($i->total_minor)->negated(), 'invoice-cancel:'.$i->id);
            }
        }
        foreach (Payment::whereIn('invoice_id', $invoices->pluck('id'))->orderBy('id')->get() as $p) {
            $add($p->payment_date->format('Y-m-d'), $p->currency, $p->currency_precision, 'Payment #'.$p->id, (string) BigInteger::of($p->amount_minor)->negated(), 'payment:'.$p->id);
            if ($p->reversed_at) {
                $add($p->reversal_date?->format('Y-m-d') ?? $p->reversed_at->copy()->timezone($timezone)->format('Y-m-d'), $p->currency, $p->currency_precision, 'Payment reversal #'.$p->id, (string) $p->amount_minor, 'payment-reverse:'.$p->id);
            }
        }
        $credits=CreditNote::where('customer_id', $customer->id)->whereNotNull('issued_at')->get();
        foreach ($credits as $c) {
            $date=$c->credit_date->format('Y-m-d');
            $add($date, $c->currency, $c->currency_precision, 'Credit '.$c->formatted_number, (string) BigInteger::of($c->total_minor)->negated(), 'credit:'.$c->id);
            if ($c->cancelled_at) {
                $add(max($date, $c->cancelled_at->copy()->timezone($timezone)->format('Y-m-d')), $c->currency, $c->currency_precision, 'Cancelled credit '.$c->formatted_number, (string) $c->total_minor, 'credit-cancel:'.$c->id);
            }
        }
        foreach (CreditRefund::whereIn('credit_note_id', $credits->pluck('id'))->get() as $r) {
            $c=$credits->firstWhere('id', $r->credit_note_id);
            $add($r->refund_date->format('Y-m-d'), $r->currency, $c->currency_precision, 'Credit refund #'.$r->id, (string) $r->amount_minor, 'refund:'.$r->id);
            if ($r->reversed_at) {
                $add($r->reversal_date?->format('Y-m-d') ?? $r->reversed_at->copy()->timezone($timezone)->format('Y-m-d'), $r->currency, $c->currency_precision, 'Refund reversal #'.$r->id, (string) BigInteger::of($r->amount_minor)->negated(), 'refund-reverse:'.$r->id);
            }
        }
        $rank = fn ($key) => match (strtok($key, ':')) {
            'invoice' => 10, 'payment' => 20, 'credit' => 30, 'refund' => 40, 'payment-reverse' => 50, 'refund-reverse' => 60, 'credit-cancel' => 70, 'invoice-cancel' => 80, default => 90
        };
        usort($entries, fn ($a, $b) => strcmp($a['date'], $b['date']) ?: ($rank($a['key']) <=> $rank($b['key'])) ?: strcmp($a['key'], $b['key']));
        $groups=[];
        foreach ($entries as $e) {
            if ($e['date'] > $to) {
                continue;
            }$key=$e['currency'].'|'.$e['precision'];
            $groups[$key] ??= ['currency'=>$e['currency'], 'precision'=>$e['precision'], 'opening'=>BigInteger::zero(), 'closing'=>BigInteger::zero(), 'charges'=>BigInteger::zero(), 'credits'=>BigInteger::zero(), 'entries'=>[]];
            $g           =&$groups[$key];
            $g['closing']=$g['closing']->plus($e['amount']);
            if ($e['date'] < $from) {
                $g['opening']=$g['opening']->plus($e['amount']);

                continue;
            }$g[$e['amount']->isPositive() ? 'charges' : 'credits']=$g[$e['amount']->isPositive() ? 'charges' : 'credits']->plus($e['amount']->abs());
            $g['entries'][]                                        =['date'=>$e['date'], 'description'=>$e['description'], 'debit'=>$e['amount']->isPositive() ? InvoiceCalculator::money((string) $e['amount'], $e['precision']) : '', 'credit'=>$e['amount']->isNegative() ? InvoiceCalculator::money((string) $e['amount']->abs(), $e['precision']) : '', 'balance'=>InvoiceCalculator::money((string) $g['closing'], $e['precision'])];
            unset($g);
        }
        foreach ($groups as &$g) {
            foreach (['opening', 'closing', 'charges', 'credits'] as $field) {
                $g[$field]=InvoiceCalculator::money((string) $g[$field], $g['precision']);
            }
        }unset($g);

        return ['customer'=>$customer->only(['id', 'display_name', 'legal_name', 'billing_address', 'billing_address_line_2', 'billing_city', 'billing_state', 'billing_postal_code', 'billing_country', 'tax_identifier']), 'from'=>$from, 'to'=>$to, 'groups'=>array_values($groups), 'sellerLines'=>InvoicePdfLayout::party($invoices->last()?->seller_snapshot ?? BillingSnapshots::seller()), 'customerLines'=>InvoicePdfLayout::party($customer->toArray(), true)];
    }
}
