<?php

namespace Modules\Seo\Schema;

use Closure;
use Illuminate\Support\Collection;
use Modules\Seo\Support\SEOData;

class BreadcrumbListSchema
{
    protected Collection $breadcrumbs;
    protected Collection $markup;

    public function __construct()
    {
        $this->breadcrumbs = new Collection();
        $this->markup = new Collection([
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
        ]);
    }

    public function prependBreadcrumbs(array $breadcrumbs): self
    {
        foreach (array_reverse($breadcrumbs, true) as $name => $url) {
            $this->breadcrumbs->prepend(['name' => $name, 'url' => $url]);
        }

        return $this;
    }

    public function appendBreadcrumbs(array $breadcrumbs): self
    {
        foreach ($breadcrumbs as $name => $url) {
            $this->breadcrumbs->push(['name' => $name, 'url' => $url]);
        }

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

        // Add current page if not already added
        if ($seoData->url && !$this->breadcrumbs->contains('url', $seoData->url)) {
            $this->breadcrumbs->push([
                'name' => $seoData->title ?? 'Current Page',
                'url' => $seoData->url,
            ]);
        }

        $itemListElement = $this->breadcrumbs->map(function ($breadcrumb, $index) {
            return [
                '@type' => 'ListItem',
                'position' => $index + 1,
                'name' => $breadcrumb['name'],
                'item' => $breadcrumb['url'],
            ];
        })->toArray();

        return $this->markup->merge([
            'itemListElement' => $itemListElement,
        ])->toArray();
    }
}
