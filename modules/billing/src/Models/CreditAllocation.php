<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditAllocation extends Model
{
    protected $table='billing_credit_allocations';

    protected $guarded=['id'];

    protected $hidden=['request_key'];

    protected function casts(): array
    {
        return ['amount_minor'=>'integer', 'invoice_id'=>'integer', 'credit_note_id'=>'integer', 'reversed_at'=>'datetime'];
    }

    public function creditNote(): BelongsTo
    {
        return $this->belongsTo(CreditNote::class);
    }
}
