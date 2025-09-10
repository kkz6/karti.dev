<?php

namespace Modules\Frontend\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Shared\Http\Controllers\BaseController;
use Modules\Speaking\Interfaces\SpeakingEventServiceInterface;

class FrontendController extends BaseController
{
    public function __construct(
        private readonly SpeakingEventServiceInterface $speakingEventService
    ) {}

    public function home(): Response
    {
        return Inertia::render('frontend::home');
    }
    
    public function contact(): Response
    {
        return Inertia::render('frontend::contact');
    }

    public function articles(): Response
    {
        return Inertia::render('frontend::articles');
    }

    public function article(string $slug): Response
    {
        return Inertia::render('frontend::article', [
            'slug' => $slug,
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

    public function services(): Response
    {
        return Inertia::render('frontend::services');
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
