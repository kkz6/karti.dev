<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class InvoiceActivity extends Model
{
    public $timestamps = false;

    protected $table = 'billing_invoice_activities';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }
}
