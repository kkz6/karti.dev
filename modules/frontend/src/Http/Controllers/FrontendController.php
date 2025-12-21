<?php

namespace Modules\Frontend\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Blog\Interfaces\ArticleServiceInterface;
use Modules\Seo\Support\SEOData;
use Modules\Shared\Http\Controllers\BaseController;
use Modules\Speaking\Interfaces\SpeakingEventServiceInterface;

class FrontendController extends BaseController
{
    public function __construct(
        private readonly SpeakingEventServiceInterface $speakingEventService,
        private readonly ArticleServiceInterface $articleService,
    ) {}

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

    public function home(): Response
    {
        $articles = $this->articleService->getPublished()->map(function ($article) {
            return [
                'slug'        => $article->slug,
                'title'       => $article->title,
                'description' => $article->excerpt,
                'date'        => $article->published_at?->toISOString() ?? $article->created_at->toISOString(),
            ];
        });

        $seoData = new SEOData(
            title: config('seo.title', config('app.name')) . ' - Developer, Speaker & Founder',
            description: config('seo.description', 'Karthick is a software designer and developer based in Bangalore, India. Building technologies that empower people to explore the world on their own terms.'),
            author: config('seo.author', 'Karthick'),
            image: config('seo.image'),
            url: url('/'),
            type: 'website',
            site_name: config('seo.site_name', config('app.name')),
            twitter_card: config('seo.twitter.card', 'summary_large_image'),
            twitter_site: config('seo.twitter.site'),
            twitter_creator: config('seo.twitter.creator'),
            robots: config('seo.robots', 'index,follow'),
            locale: config('seo.locale', 'en_US'),
        );

        $jsonLd = [
            '@context' => 'https://schema.org',
            '@type'    => 'Person',
            'name'     => 'Karthick',
            'url'      => url('/'),
            'jobTitle' => 'Software Developer & Founder',
            'sameAs'   => [
                'https://x.com/ikkarti',
                'https://github.com/kkz6',
                'https://linkedin.com/in/ikkarti',
            ],
        ];

        return Inertia::render('frontend::home', [
            'articles' => $articles,
            'seo'      => $this->getSeoArray($seoData),
            'jsonLd'   => $jsonLd,
        ]);
    }

    public function contact(): Response
    {
        return Inertia::render('frontend::contact');
    }

    public function articles(): Response
    {
        $articles = $this->articleService->getPublished()->map(function ($article) {
            return [
                'slug'        => $article->slug,
                'title'       => $article->title,
                'description' => $article->excerpt,
                'date'        => $article->published_at?->toISOString() ?? $article->created_at->toISOString(),
            ];
        });

        $seoData = new SEOData(
            title: 'Articles - ' . config('seo.site_name', config('app.name')),
            description: 'Read articles about software development, technology, and building products.',
            author: config('seo.author', 'Karthick'),
            image: config('seo.image'),
            url: url('/articles'),
            type: 'website',
            site_name: config('seo.site_name', config('app.name')),
            twitter_card: config('seo.twitter.card', 'summary_large_image'),
            twitter_site: config('seo.twitter.site'),
            twitter_creator: config('seo.twitter.creator'),
            robots: config('seo.robots', 'index,follow'),
            locale: config('seo.locale', 'en_US'),
        );

        return Inertia::render('frontend::articles', [
            'articles' => $articles,
            'seo'      => $this->getSeoArray($seoData),
        ]);
    }

    public function article(string $slug): Response
    {
        $article = $this->articleService->findBySlugOrFail($slug);
        $article->load(['seo', 'featuredImageMedia']);

        $articleUrl   = url("/articles/{$article->slug}");
        $authorName   = $article->author_name ?? $article->user?->name ?? config('seo.author', 'Karthick');
        $publishedAt  = $article->published_at?->toISOString() ?? $article->created_at->toISOString();
        $modifiedAt   = $article->updated_at->toISOString();
        $featuredImage = $article->featured_image_url ?? config('seo.image');

        // Get SEO data from model (uses HasSeo trait)
        $seoData = $article->getDynamicSEOData();

        // Transform article data to match frontend expectations
        $articleData = [
            'title'       => $article->title,
            'description' => $article->excerpt,
            'date'        => $publishedAt,
            'content'     => $article->content,
            'author'      => $authorName,
        ];

        // Article JSON-LD structured data
        $jsonLd = [
            '@context'      => 'https://schema.org',
            '@type'         => 'Article',
            'headline'      => $seoData->title ?? $article->title,
            'description'   => $seoData->description ?? $article->excerpt,
            'image'         => $featuredImage,
            'url'           => $articleUrl,
            'datePublished' => $publishedAt,
            'dateModified'  => $modifiedAt,
            'author'        => [
                '@type' => 'Person',
                'name'  => $authorName,
                'url'   => url('/'),
            ],
            'publisher'     => [
                '@type' => 'Organization',
                'name'  => config('seo.site_name', config('app.name')),
                'url'   => url('/'),
            ],
            'mainEntityOfPage' => [
                '@type' => 'WebPage',
                '@id'   => $articleUrl,
            ],
        ];

        return Inertia::render('frontend::articles/show', [
            'article' => $articleData,
            'seo'     => $this->getSeoArray($seoData),
            'jsonLd'  => $jsonLd,
        ]);
    }

    public function projects(): Response
    {
        return Inertia::render('frontend::projects');
    }

    public function uses(): Response
    {
        return Inertia::render('frontend::uses');
    }

    public function about(): Response
    {
        return Inertia::render('frontend::about');
    }

    public function speaking(): Response
    {
        $events = $this->speakingEventService->getPublishedForFrontend();

        return Inertia::render('frontend::speaking', [
            'events' => $events,
        ]);
    }
}
