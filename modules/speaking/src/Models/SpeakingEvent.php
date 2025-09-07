<?php

namespace Modules\Speaking\Models;

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
        'event_date',
        'event_type', // conference, podcast, workshop, webinar
        'location',
        'url',
        'cta_text',
        'featured',
        'sort_order',
        'status',
        'meta_title',
        'meta_description',
    ];

    protected $casts = [
        'event_date' => 'date',
        'featured' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $attributes = [
        'status' => 'published',
        'featured' => false,
        'sort_order' => 0,
        'cta_text' => 'Watch video',
    ];

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('event_type', $type);
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
