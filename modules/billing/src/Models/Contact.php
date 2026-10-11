<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Billing\Database\Factories\ContactFactory;

class Contact extends Model
{
    use HasFactory;

    protected $table = 'billing_contacts';

    protected $fillable = ['name', 'email', 'phone', 'title', 'invoice_emails'];

    protected $hidden = ['primary_slot'];

    protected $appends = ['is_primary'];

    protected function casts(): array
    {
        return ['primary_slot' => 'integer', 'invoice_emails' => 'boolean', 'archived_at' => 'datetime'];
    }

    protected static function newFactory(): ContactFactory
    {
        return ContactFactory::new();
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function getIsPrimaryAttribute(): bool
    {
        return $this->primary_slot === 1 && $this->archived_at === null;
    }
}
