<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceDelivery extends Model
{
    protected $table = 'billing_invoice_deliveries';

    protected $guarded = ['id'];

    protected $hidden = ['request_key', 'request_hash', 'pdf_path', 'pdf_hash', 'invoice_url'];

    protected function casts(): array
    {
        return ['recipients' => 'array', 'started_at' => 'datetime', 'sent_at' => 'datetime', 'invoice_url' => 'encrypted'];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
