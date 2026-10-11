<?php

namespace Modules\Billing\Services;

use Brick\Math\BigInteger;
use Modules\Billing\Models\CreditNote;

class CreditBalance
{
    public function used(CreditNote $note): BigInteger
    {
        $note->loadMissing(['allocations', 'refunds']);
        $used=BigInteger::zero();
        foreach ($note->allocations as $a) {
            if (! $a->reversed_at) {
                $used=$used->plus($a->amount_minor);
            }
        }

        return $used;
    }

    public function refunded(CreditNote $note): BigInteger
    {
        $note->loadMissing('refunds');
        $sum=BigInteger::zero();
        foreach ($note->refunds as $r) {
            if (! $r->reversed_at) {
                $sum=$sum->plus($r->amount_minor);
            }
        }

        return $sum;
    }

    public function available(CreditNote $note): BigInteger
    {
        return $note->status === 'issued' ? BigInteger::of($note->total_minor)->minus($this->used($note))->minus($this->refunded($note)) : BigInteger::zero();
    }

    public function data(CreditNote $note): array
    {
        return ['allocated'=>InvoiceCalculator::money((string) $this->used($note), $note->currency_precision), 'refunded'=>InvoiceCalculator::money((string) $this->refunded($note), $note->currency_precision), 'available'=>InvoiceCalculator::money((string) $this->available($note), $note->currency_precision)];
    }
}
