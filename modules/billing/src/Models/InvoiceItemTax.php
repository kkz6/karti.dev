<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceItemTax extends Model
{
    public $timestamps = false;

    protected $table = 'billing_invoice_item_taxes';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['tax_rate_id' => 'integer', 'percentage' => 'decimal:4'];
    }
}
