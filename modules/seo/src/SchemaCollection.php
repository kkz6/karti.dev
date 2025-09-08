<?php

namespace Modules\Seo;

use Closure;
use Illuminate\Support\Collection;
use Modules\Seo\Schema\ArticleSchema;
use Modules\Seo\Schema\BreadcrumbListSchema;
use Modules\Seo\Schema\FaqPageSchema;
use Modules\Seo\Support\SEOData;

class SchemaCollection
{
    protected Collection $schemas;

    public function __construct()
    {
        $this->schemas = new Collection();
    }

    public static function make(): self
    {
        return new self();
    }

    public static function initialize(): self
    {
        return new self();
    }

    public function add(Closure|array $schema): self
    {
        $this->schemas->push($schema);

        return $this;
    }

    public function addArticle(?Closure $callback = null): self
    {
        $article = new ArticleSchema();

        if ($callback) {
            $article = $callback($article, app(SEOData::class));
        }

        $this->schemas->push($article);

        return $this;
    }

    public function addBreadcrumbList(?Closure $callback = null): self
    {
        $breadcrumbs = new BreadcrumbListSchema();

        if ($callback) {
            $breadcrumbs = $callback($breadcrumbs, app(SEOData::class));
        }

        $this->schemas->push($breadcrumbs);

        return $this;
    }

    public function addBreadcrumbs(?Closure $callback = null): self
    {
        return $this->addBreadcrumbList($callback);
    }

    public function addFaqPage(?Closure $callback = null): self
    {
        $faq = new FaqPageSchema();

        if ($callback) {
            $faq = $callback($faq, app(SEOData::class));
        }

        $this->schemas->push($faq);

        return $this;
    }

    public function toArray(): array
    {
        return $this->schemas->map(function ($schema) {
            if ($schema instanceof Closure) {
                return $schema(app(SEOData::class));
            }

            if (is_array($schema)) {
                return $schema;
            }

            if (method_exists($schema, 'toArray')) {
                return $schema->toArray();
            }

            return $schema;
        })->toArray();
    }

    public function toJson(): string
    {
        return json_encode($this->toArray(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
}
