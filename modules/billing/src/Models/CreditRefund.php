<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class CreditRefund extends Model
{
    protected $table='billing_credit_refunds';

    protected $guarded=['id'];

    protected $hidden=['request_key'];

    protected static function booted(): void
    {
        static::creating(function (self $refund) {
            if (! $refund->payment_method_id) {
                $method = PaymentMethod::where('name', $refund->method_label)->first()
                    ?? \Modules\Billing\Support\PaymentMethods::resolve('imported', $refund->method_label, true);
                $refund->payment_method_id = $method->id;
            }
        });
    }

    public function paymentMethod(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    protected function casts(): array
    {
        return ['amount_minor'=>'integer', 'credit_note_id'=>'integer', 'refund_date'=>'date:Y-m-d', 'reversed_at'=>'datetime', 'reversal_date'=>'date:Y-m-d'];
    }
}
