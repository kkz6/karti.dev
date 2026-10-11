<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Modules\Billing\Database\Factories\CustomerFactory;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'billing_customers';

    protected $fillable = ['type', 'display_name', 'legal_name', 'phone', 'website', 'tax_identifier', 'billing_address', 'billing_address_line_2', 'billing_city', 'billing_state', 'billing_postal_code', 'billing_country', 'default_currency', 'internal_notes'];

    protected function casts(): array
    {
        return ['archived_at' => 'datetime'];
    }

    protected static function newFactory(): CustomerFactory
    {
        return CustomerFactory::new();
    }

    public function contacts(): HasMany
    {
        return $this->hasMany(Contact::class)->orderBy('id');
    }

    public function primaryContact(): HasOne
    {
        return $this->hasOne(Contact::class)->where('primary_slot', 1)->whereNull('archived_at');
    }
}
