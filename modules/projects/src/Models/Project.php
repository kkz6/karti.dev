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
        'name',
        'title',
        'slug',
        'description',
        'long_description',
        'short_description',
        'content',
        'logo',
        'featured_image',
        'link_url',
        'link_label',
        'project_url',
        'github_url',
        'demo_url',
        'technologies',
        'images',
        'status',
        'featured',
        'is_internal',
        'sort_order',
    ];

    protected $casts = [
        'technologies' => 'array',
        'images' => 'array',
        'featured' => 'boolean',
        'is_internal' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $attributes = [
        'status' => 'active',
        'featured' => false,
        'is_internal' => false,
        'sort_order' => 0,
        'technologies' => '[]',
        'images' => '[]',
    ];

    public function scopePublished($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('created_at', 'desc');
    }

    public function scopeInternal($query)
    {
        return $query->where('is_internal', true);
    }

    public function scopeExternal($query)
    {
        return $query->where('is_internal', false);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
