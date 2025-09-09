<?php

namespace Modules\Pages\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Shared\Http\Controllers\BaseController;
use Modules\Speaking\Interfaces\SpeakingEventServiceInterface;

class PagesController extends BaseController
{
    public function __construct(
        private readonly SpeakingEventServiceInterface $speakingEventService
    ) {}

    public function about(): Response
    {
        return Inertia::render('pages::about');
    }


    public function contact(): Response
    {
        return Inertia::render('pages::contact');
    }

    public function privacy(): Response
    {
        return Inertia::render('pages::privacy');
    }

    public function terms(): Response
    {
        return Inertia::render('pages::terms');
    }

    public function speaking(): Response
    {
        $events = $this->speakingEventService->getPublishedForFrontend();

        return Inertia::render('pages::speaking', [
            'events' => $events,
        ]);
    }
}
