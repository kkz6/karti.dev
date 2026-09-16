<?php

namespace Modules\Analytics\Services;

use Carbon\Carbon;
use Spatie\Analytics\Facades\Analytics;
use Spatie\Analytics\Period;

class GoogleAnalyticsReport
{
    public function get(int $days): array
    {
        $key = 'seo.google-report.'.hash('sha256', (string) config('analytics.property_id')).'.'.$days;

        return \Illuminate\Support\Facades\Cache::remember($key, now()->addMinutes(15), fn () => $this->fetchAnalyticsData($days));
    }

    private function fetchAnalyticsData(int $days): array
    {
        // Quick pre-flight checks to surface actionable errors
        $propertyId      = config('analytics.property_id');
        $credentialsPath = config('analytics.service_account_credentials_json');

        if (empty($propertyId)) {
            return $this->emptyReport('Missing ANALYTICS_PROPERTY_ID. Set it in your .env to your GA4 Property ID.');
        }

        if (! is_string($credentialsPath) || ! file_exists($credentialsPath)) {
            return $this->emptyReport('Google Analytics credentials are not configured.');
        }

        try {
            $start  = Carbon::now()->startOfDay()->subDays($days - 1);
            $period = Period::create($start, Carbon::now());

            $visitorsAndPageViews      = Analytics::fetchTotalVisitorsAndPageViews($period, $days);
            $totalVisitorsAndPageViews = Analytics::get($period, ['activeUsers', 'screenPageViews', 'averageSessionDuration', 'bounceRate']);
            $mostVisitedPages          = Analytics::fetchMostVisitedPages($period, 10);
            $topReferrers              = Analytics::fetchTopReferrers($period, 10);
            $topCountries              = Analytics::fetchTopCountries($period, 10);

            $chartData = $visitorsAndPageViews->values()->map(function ($row, $index) use ($start) {
                $rawDate = data_get($row, 'date');
                $date    = null;
                if ($rawDate instanceof \DateTimeInterface) {
                    $date = Carbon::instance(\Carbon\Carbon::parse($rawDate->format('c')));
                } elseif (is_string($rawDate)) {
                    if (preg_match('/^\d{8}$/', $rawDate)) {
                        $date = Carbon::createFromFormat('Ymd', $rawDate);
                    } else {
                        $date = Carbon::parse($rawDate);
                    }
                }
                if (! $date) {
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

            $firstTotals    = $totalVisitorsAndPageViews->first();
            $totalVisitors  = (int) (data_get($firstTotals, 'activeUsers') ?? data_get($firstTotals, 'visitors') ?? 0);
            $totalPageViews = (int) (data_get($firstTotals, 'screenPageViews') ?? data_get($firstTotals, 'pageViews') ?? 0);

            $previousPeriod = Period::create(
                $start->copy()->subDays($days),
                $start->copy()->subDay()->endOfDay()
            );
            $previousTotal    = Analytics::get($previousPeriod, ['activeUsers']);
            $previousFirst    = $previousTotal->first();
            $previousVisitors = (int) (data_get($previousFirst, 'activeUsers') ?? data_get($previousFirst, 'visitors') ?? 0);

            $visitorChange = $previousVisitors > 0
                ? round((($totalVisitors - $previousVisitors) / $previousVisitors) * 100, 1)
                : 0;

            return [
                'chartData' => $chartData,
                'stats'     => [
                    'totalVisitors'      => $totalVisitors,
                    'totalPageViews'     => $totalPageViews,
                    'visitorChange'      => $visitorChange,
                    'avgSessionDuration' => $this->formatDuration((float) (data_get($firstTotals, 'averageSessionDuration') ?? 0)),
                    'bounceRate'         => round((float) (data_get($firstTotals, 'bounceRate') ?? 0) * 100, 1),
                ],
                'mostVisitedPages' => $mostVisitedPages->map(function ($page) {
                    return [
                        'path'  => (string) (data_get($page, 'fullPageUrl') ?? data_get($page, 'pagePath') ?? '/'),
                        'title' => (string) (data_get($page, 'pageTitle') ?? 'Unknown'),
                        'views' => (int) (data_get($page, 'screenPageViews') ?? data_get($page, 'pageViews') ?? 0),
                    ];
                })->take(5)->toArray(),
                'topReferrers' => $topReferrers->map(function ($referrer) {
                    return [
                        'source'   => (string) (data_get($referrer, 'pageReferrer') ?? 'Direct'),
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
                        'country'  => $nameOrCode,
                        'sessions' => (int) (data_get($country, 'screenPageViews') ?? 0),
                    ];
                })->take(5)->toArray(),
                'configured' => true,
            ];
        } catch (\Throwable $e) {
            // Log the root cause so we can diagnose quickly
            logger()->error('Analytics fetch failed: '.$e->getMessage(), [
                'exception' => $e,
            ]);

            return $this->emptyReport('Google Analytics is temporarily unavailable. Check the server logs for details.');
        }
    }

    private function formatDuration(float $seconds): string
    {
        $minutes          = floor($seconds / 60);
        $remainingSeconds = (int) ($seconds % 60);

        return sprintf('%d:%02d', $minutes, $remainingSeconds);
    }

    private function emptyReport(?string $error = null): array
    {
        return [
            'chartData'        => [],
            'stats'            => ['totalVisitors' => 0, 'totalPageViews' => 0, 'visitorChange' => 0, 'avgSessionDuration' => null, 'bounceRate' => null],
            'mostVisitedPages' => [],
            'topReferrers'     => [],
            'topCountries'     => [],
            'configured'       => false,
            'error'            => $error,
        ];
    }
}
