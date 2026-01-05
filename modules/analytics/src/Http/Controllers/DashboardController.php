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
            '24h' => 1,
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
        // Quick pre-flight checks to surface actionable errors
        $propertyId = config('analytics.property_id');
        $credentialsPath = config('analytics.service_account_credentials_json');

        if (empty($propertyId)) {
            return $this->getDemoData($days, 'Missing ANALYTICS_PROPERTY_ID. Set it in your .env to your GA4 Property ID.');
        }

        if (!is_string($credentialsPath) || !file_exists($credentialsPath)) {
            return $this->getDemoData($days, 'Google service account credentials not found at '.$credentialsPath);
        }

        try {
            $period = Period::days($days);

            $visitorsAndPageViews = Analytics::fetchVisitorsAndPageViews($period);
            $totalVisitorsAndPageViews = Analytics::fetchTotalVisitorsAndPageViews($period);
            $mostVisitedPages = Analytics::fetchMostVisitedPages($period, 10);
            $topReferrers = Analytics::fetchTopReferrers($period, 10);
            $topCountries = Analytics::fetchTopCountries($period, 10);

            $start = Carbon::now()->subDays($days);
            $chartData = $visitorsAndPageViews->values()->map(function ($row, $index) use ($start) {
                $rawDate = data_get($row, 'date');
                $date = null;
                if ($rawDate instanceof \DateTimeInterface) {
                    $date = Carbon::instance(\Carbon\Carbon::parse($rawDate->format('c')));
                } elseif (is_string($rawDate)) {
                    if (preg_match('/^\d{8}$/', $rawDate)) {
                        $date = Carbon::createFromFormat('Ymd', $rawDate);
                    } else {
                        $date = Carbon::parse($rawDate);
                    }
                }
                if (!$date) {
                    $date = $start->copy()->addDays($index);
                }

                $visitors  = (int) (data_get($row, 'activeUsers') ?? data_get($row, 'visitors') ?? 0);
                $pageViews = (int) (data_get($row, 'screenPageViews') ?? data_get($row, 'pageViews') ?? 0);

                return [
                    'date'      => $date->format('Y-m-d'),
                    'visitors'  => $visitors,
                    'pageViews' => $pageViews,
                ];
            })->toArray();

            $firstTotals = $totalVisitorsAndPageViews->first();
            $totalVisitors = (int) (data_get($firstTotals, 'activeUsers') ?? data_get($firstTotals, 'visitors') ?? 0);
            $totalPageViews = (int) (data_get($firstTotals, 'screenPageViews') ?? data_get($firstTotals, 'pageViews') ?? 0);

            $previousPeriod = Period::create(
                Carbon::now()->subDays($days * 2),
                Carbon::now()->subDays($days + 1)
            );
            $previousTotal = Analytics::fetchTotalVisitorsAndPageViews($previousPeriod);
            $previousFirst = $previousTotal->first();
            $previousVisitors = (int) (data_get($previousFirst, 'activeUsers') ?? data_get($previousFirst, 'visitors') ?? 0);

            $visitorChange = $previousVisitors > 0
                ? round((($totalVisitors - $previousVisitors) / $previousVisitors) * 100, 1)
                : 0;

            return [
                'chartData' => $chartData,
                'stats' => [
                    'totalVisitors' => $totalVisitors,
                    'totalPageViews' => $totalPageViews,
                    'visitorChange' => $visitorChange,
                    'avgSessionDuration' => $this->formatDuration((float) (data_get($firstTotals, 'averageSessionDuration') ?? 0)),
                    'bounceRate' => round((float) (data_get($firstTotals, 'bounceRate') ?? 0), 1),
                ],
                'mostVisitedPages' => $mostVisitedPages->map(function ($page) {
                    return [
                        'path' => (string) (data_get($page, 'fullPageUrl') ?? data_get($page, 'pagePath') ?? '/'),
                        'title' => (string) (data_get($page, 'pageTitle') ?? 'Unknown'),
                        'views' => (int) (data_get($page, 'screenPageViews') ?? data_get($page, 'pageViews') ?? 0),
                    ];
                })->take(5)->toArray(),
                'topReferrers' => $topReferrers->map(function ($referrer) {
                    return [
                        'source' => (string) (data_get($referrer, 'pageReferrer') ?? 'Direct'),
                        'sessions' => (int) (data_get($referrer, 'screenPageViews') ?? data_get($referrer, 'pageViews') ?? 0),
                    ];
                })->take(5)->toArray(),
                'topCountries' => $topCountries->map(function ($country) {
                    $nameOrCode = (string) (
                        data_get($country, 'country')
                        ?? data_get($country, 'countryName')
                        ?? data_get($country, 'countryId')
                        ?? 'Unknown'
                    );
                    return [
                        'country' => $nameOrCode,
                        'sessions' => (int) (data_get($country, 'activeUsers') ?? 0),
                    ];
                })->take(5)->toArray(),
                'configured' => true,
            ];
        } catch (\Throwable $e) {
            // Log the root cause so we can diagnose quickly
            logger()->error('Analytics fetch failed: '.$e->getMessage(), [
                'exception' => $e,
            ]);
            return $this->getDemoData($days, $e->getMessage());
        }
    }

    private function formatDuration(float $seconds): string
    {
        $minutes = floor($seconds / 60);
        $remainingSeconds = (int) ($seconds % 60);

        return sprintf('%d:%02d', $minutes, $remainingSeconds);
    }

    private function getDemoData(int $days, ?string $error = null): array
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
            'error' => $error,
        ];
    }
}
