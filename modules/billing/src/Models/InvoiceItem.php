<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InvoiceItem extends Model
{
    public $timestamps = false;

    protected $table = 'billing_invoice_items';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['service_id' => 'integer', 'quantity' => 'decimal:4', 'rate' => 'decimal:4'];
    }

    public function taxes(): HasMany
    {
        return $this->hasMany(InvoiceItemTax::class)->orderBy('id');
    }
}
