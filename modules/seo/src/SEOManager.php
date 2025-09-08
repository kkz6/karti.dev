<?php

namespace Modules\Seo;

use Closure;
use Illuminate\Support\Collection;
use Modules\Seo\Support\SEOData;
use Modules\Seo\Tags\Tag;
use Modules\Seo\Tags\TagCollection;

class SEOManager
{
    protected Collection $seoDataTransformers;
    protected Collection $tagTransformers;

    public function __construct()
    {
        $this->seoDataTransformers = new Collection();
        $this->tagTransformers = new Collection();
    }

    public function SEODataTransformer(Closure $transformer): void
    {
        $this->seoDataTransformers->push($transformer);
    }

    public function tagTransformer(Closure $transformer): void
    {
        $this->tagTransformers->push($transformer);
    }

    public function generateTags(SEOData $seoData): TagCollection
    {
        // Apply SEO data transformers
        $transformedSeoData = $this->seoDataTransformers->reduce(
            fn(SEOData $data, Closure $transformer) => $transformer($data),
            $seoData
        );

        // Generate base tags
        $tags = $this->generateBaseTags($transformedSeoData);

        // Apply tag transformers
        return $this->tagTransformers->reduce(
            fn(TagCollection $tags, Closure $transformer) => $transformer($tags),
            $tags
        );
    }

    protected function generateBaseTags(SEOData $seoData): TagCollection
    {
        $tags = new TagCollection();

        // Title
        if ($seoData->title) {
            $tags->push(new \Modules\Seo\Tags\TitleTag($seoData->title));
            $tags->push(new \Modules\Seo\Tags\MetaTag('og:title', $seoData->title));
            $tags->push(new \Modules\Seo\Tags\MetaTag('twitter:title', $seoData->title));
        }

        // Description
        if ($seoData->description) {
            $tags->push(new \Modules\Seo\Tags\MetaTag('description', $seoData->description));
            $tags->push(new \Modules\Seo\Tags\MetaTag('og:description', $seoData->description));
            $tags->push(new \Modules\Seo\Tags\MetaTag('twitter:description', $seoData->description));
        }

        // Image
        if ($seoData->image) {
            $tags->push(new \Modules\Seo\Tags\MetaTag('og:image', $seoData->image));
            $tags->push(new \Modules\Seo\Tags\MetaTag('twitter:image', $seoData->image));
        }

        // URL
        if ($seoData->url) {
            $tags->push(new \Modules\Seo\Tags\MetaTag('og:url', $seoData->url));
            $tags->push(new \Modules\Seo\Tags\LinkTag('canonical', $seoData->url));
        }

        // Type
        if ($seoData->type) {
            $tags->push(new \Modules\Seo\Tags\MetaTag('og:type', $seoData->type));
        }

        // Site name
        if ($seoData->site_name) {
            $tags->push(new \Modules\Seo\Tags\MetaTag('og:site_name', $seoData->site_name));
        }

        // Twitter card
        if ($seoData->twitter_card) {
            $tags->push(new \Modules\Seo\Tags\MetaTag('twitter:card', $seoData->twitter_card));
        }

        // Twitter site
        if ($seoData->twitter_site) {
            $tags->push(new \Modules\Seo\Tags\MetaTag('twitter:site', $seoData->twitter_site));
        }

        // Twitter creator
        if ($seoData->twitter_creator) {
            $tags->push(new \Modules\Seo\Tags\MetaTag('twitter:creator', $seoData->twitter_creator));
        }

        // Robots
        if ($seoData->robots) {
            $tags->push(new \Modules\Seo\Tags\MetaTag('robots', $seoData->robots));
        }

        // Schema
        if ($seoData->schema && count($seoData->schema->toArray()) > 0) {
            $tags->push(new \Modules\Seo\Tags\SchemaTag($seoData->schema));
        }

        return $tags;
    }
}
