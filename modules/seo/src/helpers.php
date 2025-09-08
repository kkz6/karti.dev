<?php

use Modules\Seo\Support\SEOData;

if (!function_exists('seo')) {
    /**
     * Generate SEO tags for the given model or SEOData
     */
    function seo($model = null): string
    {
        $manager = app('seo-manager');

        if ($model instanceof SEOData) {
            $seoData = $model;
        } elseif ($model && method_exists($model, 'getDynamicSEOData')) {
            $seoData = $model->getDynamicSEOData();
        } else {
            $seoData = SEOData::defaults();
        }

        return $manager->generateTags($seoData)->render();
    }
}
