<?php

namespace Modules\Blog\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Modules\Seo\Traits\HasSeo;

class Tag extends Model
{
    use HasFactory, HasSeo;

    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    public function articles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class, 'article_tags');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
