<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class OnlineCheckout extends Model
{
    protected $table='billing_online_checkouts';

    protected $guarded=['id'];

    protected $hidden=['request_key', 'invoice_url'];

    public function invoice(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    protected function casts(): array
    {
        return ['expected_minor'=>'integer', 'invoice_url'=>'encrypted'];
    }
}
