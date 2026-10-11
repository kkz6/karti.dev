<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class CreditRefund extends Model
{
    protected $table='billing_credit_refunds';

    protected $guarded=['id'];

    protected $hidden=['request_key'];

    protected function casts(): array
    {
        return ['amount_minor'=>'integer', 'credit_note_id'=>'integer', 'refund_date'=>'date:Y-m-d', 'reversed_at'=>'datetime', 'reversal_date'=>'date:Y-m-d'];
    }
}
