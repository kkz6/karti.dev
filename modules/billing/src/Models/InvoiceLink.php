<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceLink extends Model
{
    protected $table='billing_invoice_links';

    protected $guarded=['id'];

    protected $hidden=['token_hash'];

    protected function casts(): array
    {
        return ['expires_at'=>'datetime', 'revoked_at'=>'datetime'];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
