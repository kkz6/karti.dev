<?php

namespace Modules\Photography\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Modules\Blog\Models\Category;

class PhotoCollection extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'cover_image',
        'status',
        'featured',
        'sort_order',
        'published_at',
        'meta_title',
        'meta_description',
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

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'photo_collection_categories');
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
        return 'slug';
    }

    public function getImageCountAttribute(): int
    {
        return $this->photos()->count();
    }
}
