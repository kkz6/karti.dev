<?php

namespace Modules\Pages\Http\Controllers;

use Modules\Shared\Http\Controllers\BaseController;
use Inertia\Inertia;
use Inertia\Response;

class PagesController extends BaseController
{
    public function about(): Response
    {
        return Inertia::render('pages::about');
    }

    public function uses(): Response
    {
        return Inertia::render('pages::uses');
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
        return Inertia::render('pages::speaking');
    }
}
