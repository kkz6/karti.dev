<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class ProviderEvent extends Model
{
    protected $table='billing_provider_events';

    protected $guarded=['id'];

    protected $hidden=['payload'];

    protected function casts(): array
    {
        return ['payload'=>'encrypted:array', 'processed_at'=>'datetime'];
    }
}
