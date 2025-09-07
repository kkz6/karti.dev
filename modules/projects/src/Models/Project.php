<?php

namespace Modules\Projects\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'short_description',
        'client',
        'project_url',
        'github_url',
        'technologies',
        'featured_image',
        'images',
        'start_date',
        'end_date',
        'status',
        'featured',
        'sort_order',
        'meta_title',
        'meta_description',
    ];

    protected $casts = [
        'technologies' => 'array',
        'images' => 'array',
        'start_date' => 'date',
        'end_date' => 'date',
        'featured' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $attributes = [
        'status' => 'published',
        'featured' => false,
        'sort_order' => 0,
        'technologies' => '[]',
        'images' => '[]',
    ];

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('start_date', 'desc');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
