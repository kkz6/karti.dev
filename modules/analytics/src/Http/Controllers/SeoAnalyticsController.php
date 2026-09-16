<?php

namespace Modules\Analytics\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Analytics\Models\PageView;
use Modules\Analytics\Services\ContentTraffic;
use Modules\Analytics\Services\GoogleAnalyticsReport;
use Modules\Analytics\Services\TrafficReport;

class SeoAnalyticsController extends Controller
{
    public function index(Request $request, TrafficReport $report): Response
    {
        $days = $this->days($request);

        return Inertia::render('seo/index', ['traffic' => $report->get($days), 'days' => $days]);
    }

    public function google(Request $request, GoogleAnalyticsReport $report): Response
    {
        $days = $this->days($request);

        return Inertia::render('seo/google', [
            'analytics' => Inertia::defer(fn () => $report->get($days)),
            'period'    => $request->input('period', '30d'),
        ]);
    }

    public function page(Request $request, TrafficReport $report): Response
    {
        $request->validate(['path' => ['required', 'string', 'max:512', 'regex:~^/(?!/)[^?#\\s]*$~']]);
        $path = $request->string('path')->toString();
        $days = $this->days($request);

        return Inertia::render('seo/index', [
            'traffic' => $report->get($days, PageView::query()->where('path', $path)),
            'days'    => $days,
            'scope'   => ['title' => $path, 'path' => $path, 'description' => 'Traffic for this exact public page.',
                'url'             => route('admin.seo.page', ['path' => $path]), 'backUrl' => route('admin.seo.index')],
        ]);
    }

    public function content(Request $request, string $type, int $id, ContentTraffic $content, TrafficReport $report): Response
    {
        $entry = $content->model($type)::query()->findOrFail($id);
        $days  = $this->days($request);

        return Inertia::render('seo/index', [
            'traffic' => $report->get($days, $content->query($type, $id)), 'days' => $days,
            'scope'   => ['title' => $entry->title, 'description' => 'Local traffic for this '.($type === 'article' ? 'article' : 'gallery').', including tracked URLs before a slug change.',
                'url'             => route('admin.seo.content', ['type' => $type, 'id' => $id]),
                'backUrl'         => route($type === 'article' ? 'admin.blog.edit' : 'admin.photography.edit', $id)],
        ]);
    }

    private function days(Request $request): int
    {
        $request->validate(['period' => ['nullable', 'in:24h,7d,30d,90d']]);

        return match ($request->input('period', '30d')) {
            '24h'   => 1,
            '7d'    => 7,
            '90d'   => 90,
            default => 30,
        };
    }
}
