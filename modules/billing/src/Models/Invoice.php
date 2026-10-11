<?php

namespace Modules\Billing\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Auth\Models\User;

class Invoice extends Model
{
    protected $table = 'billing_invoices';

    protected $guarded = ['id', 'status', 'formatted_number', 'version', 'sequence_number', 'number_prefix', 'number_padding', 'issued_at', 'cancelled_at', 'cancellation_reason'];

    protected function casts(): array
    {
        return [
            'reminders_disabled' => 'boolean',
            'issued_at'          => 'datetime', 'cancelled_at' => 'datetime', 'sequence_number' => 'integer',
            'customer_snapshot'  => 'array', 'seller_snapshot' => 'array', 'invoice_date' => 'date:Y-m-d', 'due_date' => 'date:Y-m-d',
            'customer_id'        => 'integer', 'currency_precision' => 'integer', 'version' => 'integer', 'discount_value' => 'decimal:4',
            'subtotal_minor'     => 'integer', 'discount_minor' => 'integer', 'tax_minor' => 'integer', 'total_minor' => 'integer',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function creditAllocations(): HasMany
    {
        return $this->hasMany(CreditAllocation::class);
    }

    public function links(): HasMany
    {
        return $this->hasMany(InvoiceLink::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->orderByDesc('id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('position');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(InvoiceActivity::class)->orderByDesc('id');
    }

    public function recordActivity(string $event, string $description, ?User $actor = null): void
    {
        $this->activities()->create(['actor_id' => $actor?->id, 'actor_name' => $actor?->name ?? 'System', 'event' => $event, 'description' => $description, 'created_at' => now()]);
    }
}
