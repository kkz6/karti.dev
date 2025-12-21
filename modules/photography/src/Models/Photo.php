<?php

namespace Modules\Photography\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use Modules\Blog\Models\Category;
use Modules\Media\Models\Media;
use Modules\Media\Models\Traits\Mediable;
use Modules\Seo\Traits\HasSeo;

class Photo extends Model
{
    use HasSeo, Mediable, SoftDeletes;

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

    public function getExcerptAttribute(): string
    {
        if (empty($this->description)) {
            return '';
        }

        return Str::limit(strip_tags($this->description), 160);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
