<?php

namespace Modules\Frontend\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Modules\Shared\Http\Controllers\BaseController;
use Modules\Blog\Models\Article;
use Modules\Portfolio\Models\Project;
use Modules\Profile\Models\SpeakingEvent;
use Modules\Profile\Models\WorkExperience;
use Modules\Tools\Models\ToolCategory;
use Modules\Photography\Models\PhotoCollection;
use Modules\Settings\Models\SocialLink;
use Modules\Settings\Models\SiteSetting;

class PortfolioController extends BaseController
{
    public function home()
    {
        $articles = Article::published()
            ->with(['categories', 'tags'])
            ->latest('published_at')
            ->take(4)
            ->get()
            ->map(function ($article) {
                return [
                    'slug' => $article->slug,
                    'title' => $article->title,
                    'description' => $article->excerpt,
                    'date' => $article->published_at->format('Y-m-d'),
                ];
            });

        $roles = WorkExperience::featured()
            ->ordered()
            ->get()
            ->map(function ($role) {
                return [
                    'company' => $role->company,
                    'title' => $role->position,
                    'logo' => $role->logo,
                    'start' => $role->start_date->format('Y'),
                    'end' => $role->current ? 'Present' : $role->end_date->format('Y'),
                ];
            });

        $socialLinks = SocialLink::active()->header()->ordered()->get();
        $siteSettings = SiteSetting::whereIn('key', [
            'site_title', 'site_description', 'author_name', 'author_bio'
        ])->get()->keyBy('key');
        
        return Inertia::render('frontend::home', [
            'articles' => $articles,
            'roles' => $roles,
            'socialLinks' => $socialLinks,
            'siteSettings' => $siteSettings,
        ]);
    }

    public function about()
    {
        $socialLinks = SocialLink::active()->about()->ordered()->get();
        $siteSettings = SiteSetting::whereIn('key', [
            'about_title', 'about_description', 'portrait_image', 'author_name', 'author_bio'
        ])->get()->keyBy('key');

        return Inertia::render('frontend::about', [
            'portraitImage' => $siteSettings->get('portrait_image')?->value ?? '/images/portrait.jpg',
            'socialLinks' => $socialLinks,
            'siteSettings' => $siteSettings,
        ]);
    }

    public function projects()
    {
        $projects = Project::active()
            ->with(['technologies', 'categories'])
            ->ordered()
            ->get()
            ->map(function ($project) {
                return [
                    'name' => $project->name,
                    'description' => $project->description,
                    'link' => [
                        'href' => $project->link_url ?? '#',
                        'label' => $project->link_label ?? 'View project',
                    ],
                    'logo' => $project->logo,
                    'technologies' => $project->technologies->pluck('name'),
                ];
            });
        
        return Inertia::render('frontend::projects', [
            'projects' => $projects,
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
                    'slug' => $article->slug,
                    'title' => $article->title,
                    'description' => $article->excerpt,
                    'date' => $article->published_at->format('Y-m-d'),
                    'categories' => $article->categories->pluck('name'),
                    'tags' => $article->tags->pluck('name'),
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
        
        if (!$article) {
            abort(404);
        }
        
        return Inertia::render('frontend::articles/show', [
            'article' => [
                'slug' => $article->slug,
                'title' => $article->title,
                'content' => $article->content,
                'excerpt' => $article->excerpt,
                'date' => $article->published_at->format('Y-m-d'),
                'author' => $article->author_name,
                'categories' => $article->categories,
                'tags' => $article->tags,
                'comments' => $article->comments,
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
                    'title' => $event->title,
                    'description' => $event->description,
                    'event' => $event->event_name,
                    'cta' => $event->cta_text,
                    'href' => $event->cta_url ?? '#',
                    'date' => $event->event_date->format('Y-m-d'),
                    'type' => $event->type,
                ];
            });
        
        return Inertia::render('frontend::speaking', [
            'events' => $events,
        ]);
    }

    public function uses()
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
                            'title' => $tool->title,
                            'description' => $tool->description,
                            'href' => $tool->url,
                        ];
                    }),
                ];
            });
        
        return Inertia::render('frontend::uses', [
            'sections' => $sections,
        ]);
    }

    public function photography()
    {
        $collections = PhotoCollection::published()
            ->with(['photos', 'categories'])
            ->ordered()
            ->get()
            ->map(function ($collection) {
                return [
                    'slug' => $collection->slug,
                    'title' => $collection->title,
                    'description' => $collection->description,
                    'date' => $collection->published_at->format('Y-m-d'),
                    'coverImage' => $collection->cover_image,
                    'imageCount' => $collection->photos->count(),
                    'categories' => $collection->categories->pluck('name'),
                ];
            });
        
        return Inertia::render('frontend::photography', [
            'collections' => $collections,
        ]);
    }

    public function showPhotoCollection($slug)
    {
        $collection = PhotoCollection::published()
            ->with(['photos' => function ($query) {
                $query->ordered();
            }, 'categories'])
            ->where('slug', $slug)
            ->first();
        
        if (!$collection) {
            abort(404);
        }
        
        return Inertia::render('frontend::photography/show', [
            'collection' => [
                'slug' => $collection->slug,
                'title' => $collection->title,
                'description' => $collection->description,
                'date' => $collection->published_at->format('Y-m-d'),
                'categories' => $collection->categories,
                'photos' => $collection->photos->map(function ($photo) {
                    return [
                        'title' => $photo->title,
                        'description' => $photo->description,
                        'image_path' => $photo->image_path,
                        'alt_text' => $photo->alt_text,
                        'width' => $photo->width,
                        'height' => $photo->height,
                    ];
                }),
            ],
        ]);
    }

    public function contact()
    {
        $socialLinks = SocialLink::active()->ordered()->get();
        $siteSettings = SiteSetting::whereIn('key', [
            'contact_email', 'contact_phone', 'contact_address'
        ])->get()->keyBy('key');

        return Inertia::render('frontend::contact', [
            'socialLinks' => $socialLinks,
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