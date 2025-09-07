<?php

namespace Modules\Tools\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tool extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tool_category_id',
        'title',
        'slug',
        'description',
        'url',
        'image',
        'sort_order',
        'featured',
        'status',
        'meta_title',
        'meta_description',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'featured'   => 'boolean',
    ];

    protected $attributes = [
        'status'     => 'active',
        'featured'   => false,
        'sort_order' => 0,
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ToolCategory::class, 'tool_category_id');
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
        return $query->orderBy('sort_order')->orderBy('title');
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}
