<?php

namespace Modules\Seo\Traits;

use Illuminate\Database\Eloquent\Relations\MorphOne;
use Modules\Seo\Models\Seo;
use Modules\Seo\Support\SEOData;

trait HasSeo
{
    public function seo(): MorphOne
    {
        return $this->morphOne(Seo::class, 'seoable');
    }

    public function getDynamicSEOData(): SEOData
    {
        $seoModel = $this->seo;
        $defaults = SEOData::defaults();

        return new SEOData(
            title: $seoModel?->title ?? $this->meta_title ?? $this->title ?? $defaults->title,
            description: $seoModel?->description ?? $this->meta_description ?? $this->description ?? $this->excerpt ?? $defaults->description,
            author: $seoModel?->author ?? $defaults->author,
            image: $seoModel?->image ?? $this->featured_image ?? $this->cover_image ?? $defaults->image,
            canonical_url: $seoModel?->canonical_url,
            robots: $seoModel?->robots ?? $defaults->robots,
            type: $seoModel?->type ?? $defaults->type,
            locale: $seoModel?->locale ?? $defaults->locale,
            site_name: $seoModel?->site_name ?? $defaults->site_name,
            twitter_card: $seoModel?->twitter_card ?? $defaults->twitter_card,
            twitter_site: $seoModel?->twitter_site ?? $defaults->twitter_site,
            twitter_creator: $seoModel?->twitter_creator ?? $defaults->twitter_creator,
            url: $this->getCanonicalUrl(),
        );
    }

    public function getCanonicalUrl(): ?string
    {
        if (method_exists($this, 'getUrl')) {
            return $this->getUrl();
        }

        if (isset($this->slug)) {
            return url($this->slug);
        }

        return null;
    }

    public function updateSeo(array $data): void
    {
        $this->seo()->updateOrCreate(
            ['seoable_id' => $this->getKey(), 'seoable_type' => get_class($this)],
            $data
        );
    }
}
