<?php

namespace Modules\Photography\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Photo extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'photo_collection_id',
        'title',
        'description',
        'image_path',
        'alt_text',
        'sort_order',
        'width',
        'height',
        'file_size',
        'exif_data',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'file_size' => 'integer',
        'exif_data' => 'array',
    ];

    protected $attributes = [
        'sort_order' => 0,
    ];

    public function collection(): BelongsTo
    {
        return $this->belongsTo(PhotoCollection::class, 'photo_collection_id');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('created_at');
    }
}
