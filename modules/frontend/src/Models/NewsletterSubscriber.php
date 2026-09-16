<?php

namespace Modules\Frontend\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;

class NewsletterSubscriber extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected $hidden = ['confirmation_key'];

    protected function casts(): array
    {
        return [
            'confirmation_requested_at' => 'datetime',
            'confirmation_sent_at'      => 'datetime',
            'confirmed_at'              => 'datetime',
            'unsubscribed_at'           => 'datetime',
        ];
    }

    public function scopeActive(Builder $query): void
    {
        $query->whereNotNull('confirmed_at')->whereNull('unsubscribed_at');
    }

    public function confirmationUrl(): string
    {
        return URL::temporarySignedRoute('newsletter.confirm', now()->addMinutes(config('newsletter.confirmation_minutes')), [
            'subscriber' => $this->id, 'key' => $this->confirmation_key,
        ]);
    }

    public function unsubscribeUrl(): string
    {
        return URL::signedRoute('newsletter.unsubscribe', ['subscriber' => $this->id, 'key' => $this->confirmation_key]);
    }
}
