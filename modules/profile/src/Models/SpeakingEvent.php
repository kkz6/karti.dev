<?php

namespace Modules\Profile\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SpeakingEvent extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'event_name',
        'event_url',
        'event_date',
        'location',
        'type',
        'cta_text',
        'cta_url',
        'featured',
        'sort_order',
        'status',
    ];

    protected $casts = [
        'event_date' => 'datetime',
        'featured' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $attributes = [
        'type' => 'conference',
        'status' => 'upcoming',
        'featured' => false,
        'sort_order' => 0,
    ];

    public function scopeUpcoming($query)
    {
        return $query->where('event_date', '>=', now());
    }

    public function scopePast($query)
    {
        return $query->where('event_date', '<', now());
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('event_date', 'desc')->orderBy('sort_order');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
