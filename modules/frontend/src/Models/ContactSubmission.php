<?php

namespace Modules\Frontend\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ContactSubmission extends Model
{
    use HasUuids;

    public const STATUS_NEW = 'new';

    public const STATUS_READ = 'read';

    public const STATUS_RESOLVED = 'resolved';

    protected $guarded = [];

    protected $hidden = ['ip_hash'];

    protected function casts(): array
    {
        return [
            'read_at'     => 'datetime',
            'resolved_at' => 'datetime',
            'notified_at' => 'datetime',
        ];
    }

    public function scopeOpen(Builder $query): void
    {
        $query->whereIn('status', [self::STATUS_NEW, self::STATUS_READ]);
    }

    public function markRead(): void
    {
        $this->update([
            'status'  => self::STATUS_READ,
            'read_at' => $this->read_at ?? now(),
        ]);
    }

    public function markUnread(): void
    {
        $this->update([
            'status'      => self::STATUS_NEW,
            'read_at'     => null,
            'resolved_at' => null,
        ]);
    }

    public function resolve(): void
    {
        $this->update([
            'status'      => self::STATUS_RESOLVED,
            'read_at'     => $this->read_at ?? now(),
            'resolved_at' => now(),
        ]);
    }

    public function reopen(): void
    {
        $this->update([
            'status'      => self::STATUS_READ,
            'read_at'     => $this->read_at ?? now(),
            'resolved_at' => null,
        ]);
    }
}
