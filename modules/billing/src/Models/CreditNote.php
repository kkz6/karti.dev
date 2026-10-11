<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CreditNote extends Model
{
    protected $table='billing_credit_notes';

    protected $guarded=['id'];

    protected $hidden=['request_key', 'request_hash'];

    protected function casts(): array
    {
        return ['invoice_id'=>'integer', 'customer_id'=>'integer', 'total_minor'=>'integer', 'subtotal_minor'=>'integer', 'currency_precision'=>'integer', 'version'=>'integer', 'taxes'=>'array', 'seller_snapshot'=>'array', 'customer_snapshot'=>'array', 'credit_date'=>'date:Y-m-d', 'issued_at'=>'datetime', 'cancelled_at'=>'datetime'];
    }

    public function customer(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(CreditAllocation::class);
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(CreditRefund::class);
    }
}
