<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class RecurringInvoice extends Model
{
    protected $table='billing_recurring_invoices';

    protected $guarded=['id'];

    protected function casts(): array
    {
        return ['template'=>'array', 'anchor_date'=>'date:Y-m-d', 'next_date'=>'date:Y-m-d', 'active'=>'boolean', 'cycles_done'=>'integer', 'cycle_limit'=>'integer', 'version'=>'integer', 'every'=>'integer'];
    }
}
