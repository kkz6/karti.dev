<?php

namespace Modules\Seo\Support;

use Modules\Seo\SchemaCollection;

class SEOData
{
    public function __construct(
        public ?string $title = null,
        public ?string $description = null,
        public ?string $author = null,
        public ?string $image = null,
        public ?string $canonical_url = null,
        public ?string $robots = null,
        public ?string $type = null,
        public ?string $locale = null,
        public ?string $site_name = null,
        public ?string $twitter_card = null,
        public ?string $twitter_site = null,
        public ?string $twitter_creator = null,
        public ?SchemaCollection $schema = null,
        public ?string $url = null,
    ) {
        $this->schema = $schema ?? new SchemaCollection();
    }

    public static function defaults(): self
    {
        return new self(
            title: config('seo.title'),
            description: config('seo.description'),
            author: config('seo.author'),
            image: config('seo.image'),
            robots: config('seo.robots'),
            type: config('seo.type', 'website'),
            locale: config('seo.locale', app()->getLocale()),
            site_name: config('seo.site_name'),
            twitter_card: config('seo.twitter.card', 'summary_large_image'),
            twitter_site: config('seo.twitter.site'),
            twitter_creator: config('seo.twitter.creator'),
        );
    }

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'description' => $this->description,
            'author' => $this->author,
            'image' => $this->image,
            'canonical_url' => $this->canonical_url,
            'robots' => $this->robots,
            'type' => $this->type,
            'locale' => $this->locale,
            'site_name' => $this->site_name,
            'twitter_card' => $this->twitter_card,
            'twitter_site' => $this->twitter_site,
            'twitter_creator' => $this->twitter_creator,
            'schema' => $this->schema?->toArray(),
            'url' => $this->url,
        ];
    }
}
