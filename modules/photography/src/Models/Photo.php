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

    protected static function booted(): void
    {
        static::forceDeleting(function (Photo $photo): void {
            $photo->categories()->detach();
            $photo->seo()->delete();
        });
    }

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

    /**
     * Resolve admin links generated with a numeric ID while retaining slug URLs.
     *
     * @param mixed       $value
     * @param string|null $field
     */
    public function resolveRouteBinding($value, $field = null): ?Model
    {
        if ($field === null && ctype_digit((string) $value)) {
            return $this->newQuery()->find($value)
                ?? $this->newQuery()->where($this->getRouteKeyName(), $value)->first();
        }

        return $this->newQuery()
            ->where($field ?? $this->getRouteKeyName(), $value)
            ->first();
    }
}
