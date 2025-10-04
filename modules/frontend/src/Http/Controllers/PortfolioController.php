<?php

namespace Modules\Frontend\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Blog\Models\Article;
use Modules\Profile\Models\SpeakingEvent;
use Modules\Profile\Models\WorkExperience;
use Modules\Settings\Models\SiteSetting;
use Modules\Settings\Models\SocialLink;
use Modules\Photography\Interfaces\PhotoServiceInterface;
use Modules\Shared\Http\Controllers\BaseController;

class PortfolioController extends BaseController
{
    public function __construct(
        private readonly PhotoServiceInterface $photoService
    ) {}

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
                ];
            })
            ->filter(function ($photo) {
                return !empty($photo['src']);
            })
            ->values()
            ->toArray();

        return Inertia::render('frontend::home', [
            'articles'     => $articles,
            'roles'        => $roles,
            'socialLinks'  => $socialLinks,
            'siteSettings' => $siteSettings,
            'featuredPhotos' => $featuredPhotos,
        ]);
    }

    public function about()
    {
        $socialLinks  = SocialLink::active()->about()->ordered()->get();
        $siteSettings = SiteSetting::whereIn('key', [
            'about_title', 'about_description', 'portrait_image', 'author_name', 'author_bio',
        ])->get()->keyBy('key');

        return Inertia::render('frontend::about', [
            'portraitImage' => $siteSettings->get('portrait_image')?->value ?? '/images/about.jpg',
            'socialLinks'   => $socialLinks,
            'siteSettings'  => $siteSettings,
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

        return Inertia::render('frontend::articles/index', [
            'articles' => $articles,
        ]);
    }

    public function showArticle($slug)
    {
        $article = Article::published()
            ->with(['categories', 'tags', 'comments' => function ($query) {
                $query->approved()->latest();
            }])
            ->where('slug', $slug)
            ->first();

        if (! $article) {
            abort(404);
        }

        return Inertia::render('frontend::articles/show', [
            'article' => [
                'slug'         => $article->slug,
                'title'        => $article->title,
                'content'      => $article->content,
                'excerpt'      => $article->excerpt,
                'date'         => $article->published_at->format('Y-m-d'),
                'author'       => $article->author_name,
                'categories'   => $article->categories,
                'tags'         => $article->tags,
                'comments'     => $article->comments,
                'reading_time' => $article->reading_time_minutes,
            ],
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

        return Inertia::render('frontend::speaking', [
            'events' => $events,
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
