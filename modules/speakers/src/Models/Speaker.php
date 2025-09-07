<?php

namespace Modules\Speakers\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Speaker extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'title',
        'company',
        'bio',
        'email',
        'website',
        'twitter',
        'linkedin',
        'github',
        'image',
        'featured',
        'status',
        'meta_title',
        'meta_description',
    ];

    protected $casts = [
        'featured' => 'boolean',
    ];

    protected $attributes = [
        'status' => 'active',
        'featured' => false,
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
