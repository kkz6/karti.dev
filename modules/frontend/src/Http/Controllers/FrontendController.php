<?php

namespace Modules\Frontend\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Blog\Interfaces\ArticleServiceInterface;
use Modules\Shared\Http\Controllers\BaseController;
use Modules\Speaking\Interfaces\SpeakingEventServiceInterface;

class FrontendController extends BaseController
{
    public function __construct(
        private readonly SpeakingEventServiceInterface $speakingEventService,
        private readonly ArticleServiceInterface $articleService,
    ) {}

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

        return Inertia::render('frontend::home', [
            'articles' => $articles,
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

        return Inertia::render('frontend::articles', [
            'articles' => $articles,
        ]);
    }

    public function article(string $slug): Response
    {
        $article = $this->articleService->findBySlugOrFail($slug);

        // Transform article data to match frontend expectations
        $articleData = [
            'title'       => $article->title,
            'description' => $article->excerpt,
            'date'        => $article->published_at?->toISOString() ?? $article->created_at->toISOString(),
            'content'     => $article->content,
            'author'      => $article->author_name ?? $article->user?->name ?? 'Anonymous',
        ];

        return Inertia::render('frontend::articles/show', [
            'article' => $articleData,
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
