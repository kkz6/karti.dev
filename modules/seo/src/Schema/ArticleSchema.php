<?php

namespace Modules\Seo\Schema;

use Closure;
use Illuminate\Support\Collection;
use Modules\Seo\Support\SEOData;

class ArticleSchema
{
    protected Collection $markup;

    public function __construct()
    {
        $this->markup = new Collection([
            '@context' => 'https://schema.org',
            '@type' => 'Article',
        ]);
    }

    public function addAuthor(string|object $author): self
    {
        $authorData = is_string($author) ? ['name' => $author] : $author;

        $this->markup->put('author', [
            '@type' => 'Person',
            'name' => $authorData['name'] ?? $authorData,
        ]);

        return $this;
    }

    public function markup(Closure $callback): self
    {
        $this->markup = $callback($this->markup);

        return $this;
    }

    public function toArray(): array
    {
        $seoData = app(SEOData::class);

        $defaults = [
            'headline' => $seoData->title,
            'description' => $seoData->description,
            'image' => $seoData->image,
            'url' => $seoData->url ?? request()->url(),
            'datePublished' => now()->toISOString(),
            'dateModified' => now()->toISOString(),
        ];

        return $this->markup->merge($defaults)->toArray();
    }
}
