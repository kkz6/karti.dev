<?php

namespace Modules\Analytics\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Analytics\Facades\Analytics;
use Spatie\Analytics\Period;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $period = $request->get('period', '30d');
        $days = match ($period) {
            '7d' => 7,
            '30d' => 30,
            '90d' => 90,
            default => 30,
        };

        $analyticsData = $this->fetchAnalyticsData($days);

        return Inertia::render('dashboard', [
            'analytics' => $analyticsData,
            'period' => $period,
        ]);
    }

    private function fetchAnalyticsData(int $days): array
    {
        try {
            $period = Period::days($days);

            $visitorsAndPageViews = Analytics::fetchVisitorsAndPageViews($period);
            $totalVisitorsAndPageViews = Analytics::fetchTotalVisitorsAndPageViews($period);
            $mostVisitedPages = Analytics::fetchMostVisitedPages($period, 10);
            $topReferrers = Analytics::fetchTopReferrers($period, 10);
            $topCountries = Analytics::fetchTopCountries($period, 10);

            $chartData = $visitorsAndPageViews->map(function ($row) {
                return [
                    'date' => $row['date']->format('Y-m-d'),
                    'visitors' => $row['activeUsers'] ?? $row['visitors'] ?? 0,
                    'pageViews' => $row['screenPageViews'] ?? $row['pageViews'] ?? 0,
                ];
            })->toArray();

            $totalVisitors = $totalVisitorsAndPageViews->first()['activeUsers']
                ?? $totalVisitorsAndPageViews->first()['visitors']
                ?? 0;
            $totalPageViews = $totalVisitorsAndPageViews->first()['screenPageViews']
                ?? $totalVisitorsAndPageViews->first()['pageViews']
                ?? 0;

            $previousPeriod = Period::create(
                Carbon::now()->subDays($days * 2),
                Carbon::now()->subDays($days + 1)
            );
            $previousTotal = Analytics::fetchTotalVisitorsAndPageViews($previousPeriod);
            $previousVisitors = $previousTotal->first()['activeUsers']
                ?? $previousTotal->first()['visitors']
                ?? 0;

            $visitorChange = $previousVisitors > 0
                ? round((($totalVisitors - $previousVisitors) / $previousVisitors) * 100, 1)
                : 0;

            return [
                'chartData' => $chartData,
                'stats' => [
                    'totalVisitors' => $totalVisitors,
                    'totalPageViews' => $totalPageViews,
                    'visitorChange' => $visitorChange,
                    'avgSessionDuration' => $this->formatDuration($totalVisitorsAndPageViews->first()['averageSessionDuration'] ?? 0),
                    'bounceRate' => round($totalVisitorsAndPageViews->first()['bounceRate'] ?? 0, 1),
                ],
                'mostVisitedPages' => $mostVisitedPages->map(function ($page) {
                    return [
                        'path' => $page['fullPageUrl'] ?? $page['pagePath'] ?? '/',
                        'title' => $page['pageTitle'] ?? 'Unknown',
                        'views' => $page['screenPageViews'] ?? $page['pageViews'] ?? 0,
                    ];
                })->take(5)->toArray(),
                'topReferrers' => $topReferrers->map(function ($referrer) {
                    return [
                        'source' => $referrer['pageReferrer'] ?? 'Direct',
                        'sessions' => $referrer['screenPageViews'] ?? $referrer['pageViews'] ?? 0,
                    ];
                })->take(5)->toArray(),
                'topCountries' => $topCountries->map(function ($country) {
                    return [
                        'country' => $country['country'] ?? 'Unknown',
                        'sessions' => $country['activeUsers'] ?? 0,
                    ];
                })->take(5)->toArray(),
                'configured' => true,
            ];
        } catch (\Exception $e) {
            return $this->getDemoData($days);
        }
    }

    private function formatDuration(float $seconds): string
    {
        $minutes = floor($seconds / 60);
        $remainingSeconds = (int) ($seconds % 60);

        return sprintf('%d:%02d', $minutes, $remainingSeconds);
    }

    private function getDemoData(int $days): array
    {
        $chartData = [];
        $startDate = Carbon::now()->subDays($days);

        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i);
            $baseVisitors = 100 + ($i * 2);
            $chartData[] = [
                'date' => $date->format('Y-m-d'),
                'visitors' => $baseVisitors + rand(-30, 50),
                'pageViews' => ($baseVisitors * 3) + rand(-50, 100),
            ];
        }

        $multiplier = $days / 30;

        return [
            'chartData' => $chartData,
            'stats' => [
                'totalVisitors' => (int) (12847 * $multiplier),
                'totalPageViews' => (int) (45231 * $multiplier),
                'visitorChange' => 12.5,
                'avgSessionDuration' => '2:34',
                'bounceRate' => 42.3,
            ],
            'mostVisitedPages' => [
                ['path' => '/', 'title' => 'Home', 'views' => (int) (8432 * $multiplier)],
                ['path' => '/blog', 'title' => 'Blog', 'views' => (int) (5621 * $multiplier)],
                ['path' => '/about', 'title' => 'About', 'views' => (int) (3214 * $multiplier)],
                ['path' => '/projects', 'title' => 'Projects', 'views' => (int) (2876 * $multiplier)],
                ['path' => '/contact', 'title' => 'Contact', 'views' => (int) (1543 * $multiplier)],
            ],
            'topReferrers' => [
                ['source' => 'google.com', 'sessions' => (int) (4521 * $multiplier)],
                ['source' => 'twitter.com', 'sessions' => (int) (2134 * $multiplier)],
                ['source' => 'github.com', 'sessions' => (int) (1876 * $multiplier)],
                ['source' => 'linkedin.com', 'sessions' => (int) (943 * $multiplier)],
                ['source' => 'Direct', 'sessions' => (int) (3421 * $multiplier)],
            ],
            'topCountries' => [
                ['country' => 'United States', 'sessions' => (int) (4521 * $multiplier)],
                ['country' => 'United Kingdom', 'sessions' => (int) (2134 * $multiplier)],
                ['country' => 'Germany', 'sessions' => (int) (1432 * $multiplier)],
                ['country' => 'India', 'sessions' => (int) (1287 * $multiplier)],
                ['country' => 'Canada', 'sessions' => (int) (943 * $multiplier)],
            ],
            'configured' => false,
        ];
    }
}
