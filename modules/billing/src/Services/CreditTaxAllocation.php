<?php

namespace Modules\Billing\Services;

use Brick\Math\BigDecimal;
use Brick\Math\BigInteger;
use Illuminate\Validation\ValidationException;
use Modules\Billing\Models\CreditNote;
use Modules\Billing\Models\Invoice;

class CreditTaxAllocation
{
    public function calculate(Invoice $invoice, int $face): array
    {
        $groups =app(InvoicePresentation::class)->data($invoice)['totals']['tax_groups'];
        $weights=[];
        $taxSum =BigInteger::zero();
        foreach ($groups as $group) {
            $key                 =strtolower(trim($group['name'])).'|'.$group['percentage'];
            $minor               =BigDecimal::of($group['amount'])->multipliedBy(10 ** $invoice->currency_precision)->toBigInteger();
            $weights['tax:'.$key]=['weight'=>$minor, 'tax'=>$group, 'key'=>$key];
            $taxSum              =$taxSum->plus($minor);
        }
        $weights['net']=['weight'=>BigInteger::of($invoice->total_minor)->minus($taxSum), 'tax'=>null, 'key'=>'net'];
        foreach (CreditNote::where('invoice_id', $invoice->id)->where('status', 'issued')->get() as $note) {
            $weights['net']['weight']=$weights['net']['weight']->minus($note->subtotal_minor);
            foreach ($note->taxes as $tax) {
                $key='tax:'.$tax['key'];
                if (isset($weights[$key])) {
                    $weights[$key]['weight']=$weights[$key]['weight']->minus($tax['amount_minor']);
                }
            }
        }
        $sum=BigInteger::zero();
        foreach ($weights as $w) {
            if ($w['weight']->isNegative()) {
                throw ValidationException::withMessages(['amount'=>'The source credit tax budget needs review.']);
            }$sum=$sum->plus($w['weight']);
        }
        if ($face <= 0 || BigInteger::of($face)->isGreaterThan($sum)) {
            throw ValidationException::withMessages(['amount'=>'Credit exceeds the uncredited original invoice amount.']);
        }
        $used=BigInteger::zero();
        foreach ($weights as &$w) {
            [$w['allocated'],$w['remainder']]=BigInteger::of($face)->multipliedBy($w['weight'])->quotientAndRemainder($sum);
            $used                            =$used->plus($w['allocated']);
        }unset($w);
        $keys=array_keys($weights);
        usort($keys, fn ($a, $b) =>$weights[$b]['remainder']->compareTo($weights[$a]['remainder']) ?: strcmp($a, $b));
        $residue=BigInteger::of($face)->minus($used)->toInt();
        for ($i=0; $i < $residue; $i++) {
            $weights[$keys[$i]]['allocated']=$weights[$keys[$i]]['allocated']->plus(1);
        }
        $taxes=[];
        foreach ($weights as $w) {
            if ($w['tax'] && $w['allocated']->isPositive()) {
                $taxes[]=['key'=>$w['key'], 'name'=>$w['tax']['name'], 'percentage'=>$w['tax']['percentage'], 'amount_minor'=>$w['allocated']->toInt()];
            }
        }

        return ['subtotal_minor'=>$weights['net']['allocated']->toInt(), 'taxes'=>$taxes];
    }
}
