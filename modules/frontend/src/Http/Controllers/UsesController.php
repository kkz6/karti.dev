<?php

namespace Modules\Frontend\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Seo\Support\SEOData;
use Modules\Shared\Http\Controllers\BaseController;
use Modules\Tools\Models\ToolCategory;

class UsesController extends BaseController
{
    private function getSeoArray(SEOData $seoData): array
    {
        return [
            'title'           => $seoData->title,
            'description'     => $seoData->description,
            'author'          => $seoData->author,
            'image'           => $seoData->image ? url($seoData->image) : null,
            'url'             => $seoData->url,
            'type'            => $seoData->type,
            'site_name'       => $seoData->site_name,
            'twitter_card'    => $seoData->twitter_card,
            'twitter_site'    => $seoData->twitter_site,
            'twitter_creator' => $seoData->twitter_creator,
            'robots'          => $seoData->robots,
            'locale'          => $seoData->locale,
        ];
    }

    public function index(): Response
    {
        $sections = ToolCategory::active()
            ->with(['tools' => function ($query) {
                $query->active()->ordered();
            }])
            ->ordered()
            ->get()
            ->map(function ($category) {
                return [
                    'title' => $category->name,
                    'tools' => $category->tools->map(function ($tool) {
                        return [
                            'title'       => $tool->title,
                            'description' => $tool->description,
                            'href'        => $tool->url,
                        ];
                    }),
                ];
            });

        $seoData = new SEOData(
            title: 'Uses - ' . config('seo.site_name', config('app.name')),
            description: 'Software I use, gadgets I love, and other things I recommend. A comprehensive list of tools and equipment for developers.',
            author: config('seo.author', 'Karthick'),
            image: config('seo.image'),
            url: url('/uses'),
            type: 'website',
            site_name: config('seo.site_name', config('app.name')),
            twitter_card: config('seo.twitter.card', 'summary_large_image'),
            twitter_site: config('seo.twitter.site'),
            twitter_creator: config('seo.twitter.creator'),
            robots: config('seo.robots', 'index,follow'),
            locale: config('seo.locale', 'en_US'),
        );

        return Inertia::render('frontend::uses', [
            'sections' => $sections,
            'seo'      => $this->getSeoArray($seoData),
        ]);
    }
}
