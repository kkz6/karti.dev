<?php

namespace Modules\Projects\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Seo\Traits\HasSeo;

class Project extends Model
{
    use HasFactory, SoftDeletes, HasSeo;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'short_description',
        'client',
        'featured_image',
        'project_url',
        'github_url',
        'technologies',
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
        'featured' => 'boolean',
        'sort_order' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
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
        return $query->orderBy('sort_order')->orderBy('created_at', 'desc');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
