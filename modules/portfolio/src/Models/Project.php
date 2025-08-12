<?php

namespace Modules\Portfolio\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Blog\Models\Category;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'long_description',
        'logo',
        'featured_image',
        'link_url',
        'link_label',
        'github_url',
        'demo_url',
        'status',
        'sort_order',
        'featured',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'featured' => 'boolean',
        'sort_order' => 'integer',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    protected $attributes = [
        'status' => 'active',
        'featured' => false,
        'sort_order' => 0,
    ];

    public function technologies(): BelongsToMany
    {
        return $this->belongsToMany(Technology::class, 'project_technologies');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'project_categories');
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
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
