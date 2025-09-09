<?php

namespace Modules\Photography\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Blog\Models\Category;
use Modules\Seo\Traits\HasSeo;

class Photo extends Model
{
    use HasFactory, SoftDeletes, HasSeo;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'image_ids',
        'cover_image',
        'status',
        'featured',
        'sort_order',
        'published_at',
    ];

    protected $casts = [
        'image_ids'    => 'array',
        'featured'     => 'boolean',
        'sort_order'   => 'integer',
        'published_at' => 'datetime',
    ];

    protected $attributes = [
        'status'     => 'draft',
        'featured'   => false,
        'sort_order' => 0,
        'image_ids'  => '[]',
    ];
    
    protected $appends = ['image_count'];

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'photo_categories');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where('published_at', '<=', now());
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('published_at', 'desc');
    }

    public function getRouteKeyName(): string
    {
        // Use slug for frontend routes, id for admin routes
        if (request()->is('admin/*')) {
            return 'id';
        }
        
        return 'slug';
    }

    public function getImageCountAttribute(): int
    {
        return is_array($this->image_ids) ? count($this->image_ids) : 0;
    }
}
