<?php

namespace Modules\Frontend\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Blog\Models\Article;
use Modules\Photography\Interfaces\PhotoServiceInterface;
use Modules\Profile\Models\SpeakingEvent;
use Modules\Profile\Models\WorkExperience;
use Modules\Seo\Support\SEOData;
use Modules\Settings\Models\SiteSetting;
use Modules\Settings\Models\SocialLink;
use Modules\Shared\Http\Controllers\BaseController;

class PortfolioController extends BaseController
{
    public function __construct(
        private readonly PhotoServiceInterface $photoService
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

    public function home()
    {
        $articles = Article::published()
            ->with(['categories', 'tags'])
            ->latest('published_at')
            ->take(4)
            ->get()
            ->map(function ($article) {
                return [
                    'slug'        => $article->slug,
                    'title'       => $article->title,
                    'description' => $article->excerpt,
                    'date'        => $article->published_at->format('Y-m-d'),
                ];
            });

        $roles = WorkExperience::featured()
            ->ordered()
            ->get()
            ->map(function ($role) {
                return [
                    'company' => $role->company,
                    'title'   => $role->position,
                    'logo'    => $role->logo,
                    'start'   => $role->start_date->format('Y'),
                    'end'     => $role->current ? 'Present' : $role->end_date->format('Y'),
                ];
            });

        $socialLinks  = SocialLink::active()->header()->ordered()->get();
        $siteSettings = SiteSetting::whereIn('key', [
            'site_title', 'site_description', 'author_name', 'author_bio',
        ])->get()->keyBy('key');

        // Get featured photos for the hero section
        $featuredPhotos = $this->photoService->getFeatured()
            ->take(5)
            ->map(function ($photo) {
                // Use the first image from gallery, or cover_image as fallback
                $imageUrl = null;
                $galleryImages = $photo->images;
                
                if ($galleryImages->isNotEmpty()) {
                    $imageUrl = $galleryImages->first()->getUrl();
                } elseif ($photo->cover_image) {
                    $imageUrl = $photo->cover_image->getUrl();
                }
                
                return [
                    'src' => $imageUrl,
                    'alt' => $photo->title . ' - Featured photography',
                    'title' => $photo->title,
                    'description' => $photo->short_description ?? substr($photo->description, 0, 50) . '...',
                    'slug' => $photo->slug,
                ];
            })
            ->filter(function ($photo) {
                return !empty($photo['src']);
            })
            ->values()
            ->toArray();

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
            'articles'       => $articles,
            'roles'          => $roles,
            'socialLinks'    => $socialLinks,
            'siteSettings'   => $siteSettings,
            'featuredPhotos' => $featuredPhotos,
            'seo'            => $this->getSeoArray($seoData),
            'jsonLd'         => $jsonLd,
        ]);
    }

    public function about()
    {
        $socialLinks  = SocialLink::active()->about()->ordered()->get();
        $siteSettings = SiteSetting::whereIn('key', [
            'about_title', 'about_description', 'portrait_image', 'author_name', 'author_bio',
        ])->get()->keyBy('key');

        $seoData = new SEOData(
            title: 'About - ' . config('seo.site_name', config('app.name')),
            description: 'Learn about Karthick, a software developer and founder based in Bangalore. Building technologies that empower people to explore the world on their own terms.',
            author: config('seo.author', 'Karthick'),
            image: $siteSettings->get('portrait_image')?->value ?? config('seo.image'),
            url: url('/about'),
            type: 'profile',
            site_name: config('seo.site_name', config('app.name')),
            twitter_card: config('seo.twitter.card', 'summary_large_image'),
            twitter_site: config('seo.twitter.site'),
            twitter_creator: config('seo.twitter.creator'),
            robots: config('seo.robots', 'index,follow'),
            locale: config('seo.locale', 'en_US'),
        );

        $jsonLd = [
            '@context'  => 'https://schema.org',
            '@type'     => 'Person',
            'name'      => 'Karthick',
            'url'       => url('/about'),
            'image'     => $siteSettings->get('portrait_image')?->value ?? config('seo.image'),
            'jobTitle'  => 'Software Developer & Founder',
            'worksFor'  => [
                '@type' => 'Organization',
                'name'  => config('app.name'),
            ],
            'sameAs'    => [
                'https://x.com/ikkarti',
                'https://github.com/kkz6',
                'https://linkedin.com/in/ikkarti',
            ],
        ];

        return Inertia::render('frontend::about', [
            'portraitImage' => $siteSettings->get('portrait_image')?->value ?? '/images/about.jpg',
            'socialLinks'   => $socialLinks,
            'siteSettings'  => $siteSettings,
            'seo'           => $this->getSeoArray($seoData),
            'jsonLd'        => $jsonLd,
        ]);
    }


    public function articles()
    {
        $articles = Article::published()
            ->with(['categories', 'tags'])
            ->latest('published_at')
            ->get()
            ->map(function ($article) {
                return [
                    'slug'        => $article->slug,
                    'title'       => $article->title,
                    'description' => $article->excerpt,
                    'date'        => $article->published_at->format('Y-m-d'),
                    'categories'  => $article->categories->pluck('name'),
                    'tags'        => $article->tags->pluck('name'),
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

        return Inertia::render('frontend::articles/index', [
            'articles' => $articles,
            'seo'      => $this->getSeoArray($seoData),
        ]);
    }

    public function showArticle($slug)
    {
        $article = Article::published()
            ->with(['categories', 'tags', 'seo', 'comments' => function ($query) {
                $query->approved()->latest();
            }])
            ->where('slug', $slug)
            ->first();

        if (! $article) {
            abort(404);
        }

        $articleUrl    = url("/articles/{$article->slug}");
        $authorName    = $article->author_name ?? config('seo.author', 'Karthick');
        $publishedAt   = $article->published_at->toISOString();
        $modifiedAt    = $article->updated_at->toISOString();
        $featuredImage = $article->featured_image ? url($article->featured_image) : config('seo.image');

        $seoData = $article->getDynamicSEOData();

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
            'article' => [
                'slug'         => $article->slug,
                'title'        => $article->title,
                'content'      => $article->content,
                'description'  => $article->excerpt,
                'date'         => $article->published_at->format('Y-m-d'),
                'author'       => $authorName,
                'categories'   => $article->categories,
                'tags'         => $article->tags,
                'comments'     => $article->comments,
                'reading_time' => $article->reading_time_minutes,
            ],
            'seo'     => $this->getSeoArray($seoData),
            'jsonLd'  => $jsonLd,
        ]);
    }

    public function speaking()
    {
        $events = SpeakingEvent::ordered()
            ->get()
            ->map(function ($event) {
                return [
                    'title'       => $event->title,
                    'description' => $event->description,
                    'event'       => $event->event_name,
                    'cta'         => $event->cta_text,
                    'href'        => $event->cta_url ?? '#',
                    'date'        => $event->event_date->format('Y-m-d'),
                    'type'        => $event->type,
                ];
            });

        $seoData = new SEOData(
            title: 'Speaking - ' . config('seo.site_name', config('app.name')),
            description: 'Karthick has spoken at events around the world and been interviewed for many podcasts. See upcoming and past speaking engagements.',
            author: config('seo.author', 'Karthick'),
            image: config('seo.image'),
            url: url('/speaking'),
            type: 'website',
            site_name: config('seo.site_name', config('app.name')),
            twitter_card: config('seo.twitter.card', 'summary_large_image'),
            twitter_site: config('seo.twitter.site'),
            twitter_creator: config('seo.twitter.creator'),
            robots: config('seo.robots', 'index,follow'),
            locale: config('seo.locale', 'en_US'),
        );

        return Inertia::render('frontend::speaking', [
            'events' => $events,
            'seo'    => $this->getSeoArray($seoData),
        ]);
    }



    public function contact()
    {
        $socialLinks  = SocialLink::active()->ordered()->get();
        $siteSettings = SiteSetting::whereIn('key', [
            'contact_email', 'contact_phone', 'contact_address',
        ])->get()->keyBy('key');

        return Inertia::render('frontend::contact', [
            'socialLinks'  => $socialLinks,
            'siteSettings' => $siteSettings,
        ]);
    }

    public function thankYou(Request $request)
    {
        // Handle newsletter subscription
        $email = $request->input('email');

        // TODO: Save email to newsletter list

        return Inertia::render('frontend::thank-you');
    }
}
