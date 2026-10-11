<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $table = 'billing_payments';

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $hidden = ['request_key', 'request_hash'];

    protected function casts(): array
    {
        return ['amount_minor' => 'integer', 'currency_precision' => 'integer', 'payment_date' => 'date:Y-m-d', 'created_at' => 'datetime', 'reversed_at' => 'datetime', 'reversal_date' => 'date:Y-m-d'];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
