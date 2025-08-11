<?php

namespace Modules\Frontend\Http\Controllers;

use Modules\Shared\Http\Controllers\BaseController;
use Inertia\Inertia;
use Inertia\Response;

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
            'slug' => $slug
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

    public function photography(): Response
    {
        return Inertia::render('frontend::photography');
    }

    public function photographyShow(string $slug): Response
    {
        // Fetch collection data based on slug
        // For now, return with default data
        $collection = [
            'slug' => $slug,
            'title' => ucfirst(str_replace('-', ' ', $slug)),
            'description' => 'A collection of photographs exploring themes and moments.',
            'date' => '2024-01-15',
            'location' => 'Various Locations',
            'camera' => 'Canon EOS R5',
            'photos' => []
        ];
        
        return Inertia::render('frontend::photography/show', [
            'collection' => $collection
        ]);
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
