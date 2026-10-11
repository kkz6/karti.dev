<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Billing\Database\Factories\TaxRateFactory;

class TaxRate extends Model
{
    use HasFactory;

    protected $table = 'billing_tax_rates';

    protected $fillable = ['name', 'percentage'];

    protected function casts(): array
    {
        return ['percentage' => 'decimal:4', 'archived_at' => 'datetime'];
    }

    protected static function newFactory(): TaxRateFactory
    {
        return TaxRateFactory::new();
    }

    public function services(): BelongsToMany
    {
        return $this->belongsToMany(Service::class, 'billing_service_tax_rates');
    }
}
