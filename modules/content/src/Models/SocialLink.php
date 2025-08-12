<?php

namespace Modules\Content\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SocialLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'platform',
        'label',
        'url',
        'icon',
        'sort_order',
        'is_active',
        'show_in_header',
        'show_in_footer',
        'show_in_about',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean',
        'show_in_header' => 'boolean',
        'show_in_footer' => 'boolean',
        'show_in_about' => 'boolean',
    ];

    protected $attributes = [
        'is_active' => true,
        'show_in_header' => true,
        'show_in_footer' => true,
        'show_in_about' => true,
        'sort_order' => 0,
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeHeader($query)
    {
        return $query->where('show_in_header', true);
    }

    public function scopeFooter($query)
    {
        return $query->where('show_in_footer', true);
    }

    public function scopeAbout($query)
    {
        return $query->where('show_in_about', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }
}
