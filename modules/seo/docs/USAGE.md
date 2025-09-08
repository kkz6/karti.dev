# SEO Module Usage

## Overview

The SEO module provides a comprehensive solution for managing SEO metadata across your Laravel application using morph relationships. It's based on the popular `ralphjsmit/laravel-seo` package.

## Model Setup

Models that need SEO support should use the `HasSeo` trait:

```php
<?php

namespace Modules\Blog\Models;

use Modules\Seo\Traits\HasSeo;
use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    use HasSeo;

    // Your model code...
}
```

## Usage in Controllers

### Basic Usage

```php
<?php

namespace Modules\Blog\Http\Controllers;

use Modules\Blog\Models\Article;
use Modules\Seo\Support\SEOData;

class ArticleController extends Controller
{
    public function show(Article $article)
    {
        // The model automatically provides SEO data via the HasSeo trait
        return inertia('Blog::show', [
            'article' => $article,
        ]);
    }

    public function store(Request $request)
    {
        $article = Article::create($request->validated());

        // Update SEO data
        if ($request->has('seo')) {
            $article->updateSeo($request->input('seo'));
        }

        return redirect()->route('articles.show', $article);
    }
}
```

### Manual SEO Data

You can also create SEO data manually:

```php
public function homepage()
{
    $seoData = new SEOData(
        title: 'Welcome to My Site',
        description: 'This is the homepage of my amazing website',
        image: asset('images/homepage-og.jpg'),
        type: 'website'
    );

    return inertia('Frontend::home', [
        'seoData' => $seoData,
    ]);
}
```

## Frontend Integration

### Using the SEO Fields Component

In your React forms, use the new SEO fields component:

```tsx
import { SEOFields } from '@seo/components/SeoFields';

export default function EditArticle({ article }) {
    const { data, setData, errors } = useForm({
        title: article.title,
        content: article.content,
        seo: article.seo || {},
    });

    return (
        <form onSubmit={handleSubmit}>
            {/* Other form fields */}

            <SEOFields data={data} setData={setData} errors={errors} />
        </form>
    );
}
```

### Rendering SEO Tags

The SEO tags are automatically rendered using the `seo()` helper function. In your Blade layouts:

```blade
{!! seo($model ?? null) !!}
```

Or for specific SEO data:

```blade
{!! seo($seoData) !!}
```

## Schema.org Structured Data

### Adding Article Schema

```php
public function getDynamicSEOData(): SEOData
{
    return new SEOData(
        title: $this->title,
        description: $this->excerpt,
        schema: SchemaCollection::make()
            ->addArticle(function (ArticleSchema $article, SEOData $seoData): ArticleSchema {
                return $article->addAuthor($this->author_name);
            })
    );
}
```

### Adding Breadcrumbs

```php
public function getDynamicSEOData(): SEOData
{
    return new SEOData(
        title: $this->title,
        description: $this->description,
        schema: SchemaCollection::make()
            ->addBreadcrumbs(function (BreadcrumbListSchema $breadcrumbs, SEOData $seoData): BreadcrumbListSchema {
                return $breadcrumbs
                    ->prependBreadcrumbs([
                        'Home' => url('/'),
                        'Blog' => route('blog.index'),
                        'Category' => route('categories.show', $this->category),
                    ]);
            })
    );
}
```

### Adding FAQ Schema

```php
public function getDynamicSEOData(): SEOData
{
    return new SEOData(
        title: 'Frequently Asked Questions',
        description: 'Common questions and answers',
        schema: SchemaCollection::make()
            ->addFaqPage(function (FaqPageSchema $faq, SEOData $seoData): FaqPageSchema {
                return $faq
                    ->addQuestion('What is this?', 'This is an example FAQ.')
                    ->addQuestion('How does it work?', 'It works great!');
            })
    );
}
```

## Configuration

Publish the configuration file:

```bash
php artisan vendor:publish --tag=seo-config
```

Then update `config/seo.php` with your default values:

```php
return [
    'title' => 'Your Site Name',
    'description' => 'Your site description',
    'image' => '/images/default-og-image.jpg',
    // ... other settings
];
```

## Migration from Old SEO Fields

The migration automatically moves existing `meta_title` and `meta_description` data to the new SEO table. The `HasSeo` trait provides backward compatibility by falling back to these fields if no SEO model exists.

## Advanced Usage

### Custom SEO Data Transformers

```php
use Modules\Seo\Facades\SEOManager;

// In a service provider boot method
SEOManager::SEODataTransformer(function (SEOData $seoData): SEOData {
    // Add site name to all titles
    if ($seoData->title && !str_contains($seoData->title, config('app.name'))) {
        $seoData->title .= ' - ' . config('app.name');
    }

    return $seoData;
});
```

### Custom Tag Transformers

```php
use Modules\Seo\Tags\MetaTag;
use Modules\Seo\Tags\TagCollection;

SEOManager::tagTransformer(function (TagCollection $tags): TagCollection {
    // Add custom meta tag
    $tags->push(new MetaTag('custom-tag', 'custom-value'));

    return $tags;
});
```
