<?php

namespace Modules\Frontend\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Frontend\Models\NewsletterSubscriber;
use Modules\Frontend\Tables\NewsletterSubscribers;

class NewsletterSubscribersController extends Controller
{
    public function index(Request $request): Response
    {
        $request->validate(['search' => ['nullable', 'string', 'max:254']]);

        return Inertia::render('newsletter/index', [
            'table'       => NewsletterSubscribers::make()->setRequest($request),
            'counts'      => [
                'active'       => NewsletterSubscriber::active()->count(),
                'pending'      => NewsletterSubscriber::whereNull('confirmed_at')->whereNull('unsubscribed_at')->count(),
                'unsubscribed' => NewsletterSubscriber::whereNotNull('unsubscribed_at')->count(),
            ],
        ]);
    }
}
