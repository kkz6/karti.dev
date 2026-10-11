<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class ImportBatch extends Model
{
    protected $table='billing_import_batches';

    protected $guarded=['id'];

    protected $hidden=['manifest'];

    protected function casts(): array
    {
        return ['manifest'=>'encrypted:array', 'report'=>'array', 'imported_at'=>'datetime'];
    }
}
