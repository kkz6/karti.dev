<?php

namespace Modules\Photography\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Blog\Models\Category;
use Modules\Media\Models\Media;
use Modules\Media\Models\Traits\Mediable;
use Modules\Seo\Traits\HasSeo;

class Photo extends Model
{
    use HasFactory, SoftDeletes, HasSeo, Mediable;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'status',
        'featured',
        'sort_order',
        'published_at',
    ];

    protected $casts = [
        'featured'     => 'boolean',
        'sort_order'   => 'integer',
        'published_at' => 'datetime',
    ];

    protected $attributes = [
        'status'     => 'draft',
        'featured'   => false,
        'sort_order' => 0,
    ];
    
    protected $appends = ['image_count'];

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'photo_categories');
    }

    public function getImagesAttribute()
    {
        return $this->getMedia('gallery');
    }

    public function getCoverImageAttribute(): ?Media
    {
        return $this->firstMedia('cover');
    }

    public function getCoverImageUrlAttribute(): ?string
    {
        $coverMedia = $this->cover_image;

        if (! $coverMedia) {
            return null;
        }

        return $coverMedia->getUrl();
    }

    public function getCoverImageThumbnailAttribute(): ?string
    {
        $coverMedia = $this->cover_image;

        if (! $coverMedia) {
            return null;
        }

        $thumbVariant = $coverMedia->variants->firstWhere('variant_name', 'thumb');

        return $thumbVariant ? $thumbVariant->getUrl() : $coverMedia->getUrl();
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
        return $this->images->count();
    }
}
