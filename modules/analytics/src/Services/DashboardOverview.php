<?php

namespace Modules\Analytics\Services;

use Illuminate\Support\Collection;
use Modules\Analytics\Models\PageView;
use Modules\Blog\Models\Article;
use Modules\Frontend\Models\ConsultationBooking;
use Modules\Frontend\Models\NewsletterSubscriber;
use Modules\Media\Models\Media;
use Modules\Photography\Models\Photo;
use Modules\Projects\Models\Project;

class DashboardOverview
{
    public function __construct(private readonly TrafficReport $trafficReport) {}

    public function get(int $days = 30): array
    {
        $today         = now('UTC')->startOfDay();
        $currentStart  = $today->copy()->subDays($days - 1);
        $previousStart = $currentStart->copy()->subDays($days);
        $previousEnd   = $currentStart->copy()->subDay();
        $traffic       = $this->trafficReport->get($days);
        $previous      = PageView::query()
            ->whereBetween('viewed_on', [$previousStart->toDateString(), $previousEnd->toDateString()])
            ->selectRaw('COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors')
            ->first();

        $newSubscribers      = NewsletterSubscriber::query()->where('created_at', '>=', $currentStart)->count();
        $previousSubscribers = NewsletterSubscriber::query()
            ->whereBetween('created_at', [$previousStart, $currentStart->copy()->subSecond()])
            ->count();
        $subscriberTotal = NewsletterSubscriber::query()->count();
        $confirmedTotal  = NewsletterSubscriber::query()->whereNotNull('confirmed_at')->count();

        return [
            'period'  => ['days' => $days, 'label' => "Last {$days} days", 'timezone' => 'UTC'],
            'traffic' => [
                'views'         => $traffic['views'],
                'dailyVisitors' => $traffic['dailyVisitors'],
                'viewsTrend'    => $this->trend($traffic['views'], (int) ($previous->views ?? 0)),
                'visitorsTrend' => $this->trend($traffic['dailyVisitors'], (int) ($previous->visitors ?? 0)),
                'chart'         => $traffic['chart'],
                'topPages'      => $this->topPages($currentStart->toDateString(), $today->toDateString()),
                'enabled'       => $traffic['enabled'],
            ],
            'newsletter' => [
                'active'           => NewsletterSubscriber::active()->count(),
                'newSubscribers'   => $newSubscribers,
                'newTrend'         => $this->trend($newSubscribers, $previousSubscribers),
                'pending'          => NewsletterSubscriber::query()->whereNull('confirmed_at')->whereNull('unsubscribed_at')->count(),
                'unsubscribed'     => NewsletterSubscriber::query()->whereNotNull('unsubscribed_at')->count(),
                'confirmationRate' => $subscriberTotal > 0 ? (int) round(($confirmedTotal / $subscriberTotal) * 100) : 0,
            ],
            'content' => [
                'articles' => [
                    'total'     => Article::query()->count(),
                    'published' => Article::query()->published()->count(),
                    'drafts'    => Article::query()->draft()->count(),
                ],
                'galleries' => [
                    'total'     => Photo::query()->count(),
                    'published' => Photo::query()->published()->count(),
                    'drafts'    => Photo::query()->where('status', 'draft')->count(),
                ],
                'projects' => [
                    'total'     => Project::query()->count(),
                    'published' => Project::query()->published()->count(),
                    'drafts'    => Project::query()->where('status', 'draft')->count(),
                ],
                'media' => Media::query()->whereIsOriginal()->count(),
            ],
            'bookings' => [
                'pending'   => ConsultationBooking::query()->pending()->count(),
                'confirmed' => ConsultationBooking::query()->confirmed()->count(),
            ],
            'recentContent' => $this->recentContent(),
        ];
    }

    private function trend(int $current, int $previous): array
    {
        if ($previous === 0) {
            return [
                'direction' => $current > 0 ? 'new' : 'flat',
                'percent'   => null,
            ];
        }

        $percent = (int) round((($current - $previous) / $previous) * 100);

        return [
            'direction' => $percent > 0 ? 'up' : ($percent < 0 ? 'down' : 'flat'),
            'percent'   => abs($percent),
        ];
    }

    private function recentContent(): array
    {
        return collect([
            ...$this->recentEntries(Article::query()->latest('updated_at')->limit(5)->get(), 'Article', 'admin.blog.edit'),
            ...$this->recentEntries(Photo::query()->latest('updated_at')->limit(5)->get(), 'Gallery', 'admin.photography.edit'),
            ...$this->recentEntries(Project::query()->latest('updated_at')->limit(5)->get(), 'Project', 'admin.projects.edit'),
        ])->sortByDesc('updatedAt')->take(5)->values()->all();
    }

    private function topPages(string $start, string $end): array
    {
        return PageView::query()
            ->whereBetween('viewed_on', [$start, $end])
            ->select('path')
            ->selectRaw('COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors')
            ->groupBy('path')
            ->orderByDesc('views')
            ->limit(5)
            ->get()
            ->map(fn (PageView $page): array => [
                'path'     => $page->path,
                'views'    => (int) $page->views,
                'visitors' => (int) $page->visitors,
                'url'      => route('admin.seo.page', ['path' => $page->path]),
            ])->all();
    }

    private function recentEntries(Collection $entries, string $type, string $routeName): array
    {
        return $entries->map(fn ($entry): array => [
            'id'        => $type.'-'.$entry->getKey(),
            'type'      => $type,
            'title'     => $entry->title ?: "Untitled {$type}",
            'status'    => $entry->status,
            'updatedAt' => $entry->updated_at?->toIso8601String(),
            'url'       => route($routeName, $entry),
        ])->all();
    }
}
