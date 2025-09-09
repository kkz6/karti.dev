<?php

namespace Modules\Frontend\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Modules\Shared\Http\Controllers\BaseController;

class FrontendController extends BaseController
{
    public function home(): Response
    {
        return Inertia::render('frontend::home');
    }

    public function about(): Response
    {
        return Inertia::render('frontend::about');
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

    public function speaking(): Response
    {
        return Inertia::render('frontend::speaking');
    }

    public function uses(): Response
    {
        return Inertia::render('frontend::uses');
    }

    public function services(): Response
    {
        return Inertia::render('frontend::services');
    }

    public function portfolio(): Response
    {
        return Inertia::render('frontend::portfolio');
    }


    public function privacy(): Response
    {
        return Inertia::render('frontend::privacy');
    }

    public function terms(): Response
    {
        return Inertia::render('frontend::terms');
    }
}
