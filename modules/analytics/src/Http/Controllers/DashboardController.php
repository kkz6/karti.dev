<?php

namespace Modules\Analytics\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Analytics\Services\DashboardOverview;

class DashboardController extends Controller
{
    public function index(DashboardOverview $overview): Response
    {
        return Inertia::render('dashboard', [
            'overview' => $overview->get(),
        ]);
    }
}
