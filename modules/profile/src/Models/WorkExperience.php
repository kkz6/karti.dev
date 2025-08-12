<?php

namespace Modules\Profile\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkExperience extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'company',
        'position',
        'description',
        'logo',
        'company_url',
        'start_date',
        'end_date',
        'current',
        'sort_order',
        'featured',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'current' => 'boolean',
        'sort_order' => 'integer',
        'featured' => 'boolean',
    ];

    protected $attributes = [
        'current' => false,
        'featured' => false,
        'sort_order' => 0,
    ];

    public function scopeCurrent($query)
    {
        return $query->where('current', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('start_date', 'desc');
    }

    public function getDurationAttribute(): string
    {
        $start = $this->start_date->format('M Y');
        $end = $this->current ? 'Present' : $this->end_date->format('M Y');
        
        return "{$start} - {$end}";
    }
}
