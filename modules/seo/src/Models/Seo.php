<?php

namespace Modules\Seo\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Seo extends Model
{
    protected $fillable = [
        'title',
        'description',
        'author',
        'image',
        'canonical_url',
        'robots',
        'type',
        'locale',
        'site_name',
        'twitter_card',
        'twitter_site',
        'twitter_creator',
        'schema',
        'seoable_id',
        'seoable_type',
    ];

    protected $casts = [
        'schema' => 'array',
    ];

    public function seoable(): MorphTo
    {
        return $this->morphTo();
    }
}
