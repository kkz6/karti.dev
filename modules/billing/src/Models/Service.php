<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Billing\Database\Factories\ServiceFactory;

class Service extends Model
{
    use HasFactory;

    protected $table = 'billing_services';

    protected $fillable = ['name', 'description', 'unit', 'rate', 'currency'];

    protected function casts(): array
    {
        return ['rate' => 'decimal:4', 'archived_at' => 'datetime'];
    }

    protected static function newFactory(): ServiceFactory
    {
        return ServiceFactory::new();
    }

    public function taxRates(): BelongsToMany
    {
        return $this->belongsToMany(TaxRate::class, 'billing_service_tax_rates')->orderBy('billing_tax_rates.id');
    }
}
