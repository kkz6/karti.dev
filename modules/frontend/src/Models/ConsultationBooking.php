<?php

declare(strict_types=1);

namespace Modules\Frontend\Models;

use Illuminate\Database\Eloquent\Model;

class ConsultationBooking extends Model
{
    protected $fillable = [
        'expected_amount_minor', 'expected_currency', 'return_token_hash', 'fulfillment_state', 'billing_customer_id',
        'name',
        'email',
        'profession',
        'message',
        'timezone',
        'slot_start',
        'slot_end',
        'status',
        'payment_id',
        'payment_link',
        'calcom_booking_uid',
        'reservation_uid',
        'calcom_data',
        'paid_at',
    ];

    protected $hidden = ['return_token_hash'];

    protected $casts = [
        'expected_amount_minor' => 'integer', 'billing_customer_id' => 'integer',
        'slot_start'            => 'datetime',
        'slot_end'              => 'datetime',
        'paid_at'               => 'datetime',
        'calcom_data'           => 'array',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopeExpired($query)
    {
        return $query->where('status', 'expired');
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    public function markConfirmed(?string $calcomBookingUid = null, ?array $calcomData = null): void
    {
        $this->update([
            'status'             => 'confirmed',
            'paid_at'            => now(),
            'calcom_booking_uid' => $calcomBookingUid,
            'calcom_data'        => $calcomData,
        ]);
    }

    public function markExpired(): void
    {
        $this->update(['status' => 'expired']);
    }

    public function markCancelled(): void
    {
        $this->update(['status' => 'cancelled']);
    }
}
