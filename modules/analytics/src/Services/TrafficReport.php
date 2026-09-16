<?php

namespace Modules\Analytics\Services;

use Illuminate\Database\Eloquent\Builder;
use Modules\Analytics\Models\PageView;

class TrafficReport
{
    public function get(int $days, ?Builder $scope = null): array
    {
        $start = now('UTC')->startOfDay()->subDays($days - 1);
        $query = ($scope ? clone $scope : PageView::query())->whereBetween('viewed_on', [$start->toDateString(), now('UTC')->toDateString()]);
        $daily = (clone $query)->selectRaw('viewed_on, COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors')
            ->groupBy('viewed_on')->orderBy('viewed_on')->get()->keyBy('viewed_on');
        $chart = collect(range(0, $days - 1))->map(function (int $offset) use ($start, $daily): array {
            $date = $start->copy()->addDays($offset)->toDateString();

            return ['date' => $date, 'views' => (int) ($daily[$date]->views ?? 0), 'visitors' => (int) ($daily[$date]->visitors ?? 0)];
        });

        return [
            'views'         => $chart->sum('views'),
            'dailyVisitors' => $chart->sum('visitors'),
            'chart'         => $chart->all(),
            'pages'         => $this->breakdown($query, 'path'),
            'referrers'     => $this->breakdown($query, 'referrer_host'),
            'browsers'      => $this->breakdown($query, 'browser'),
            'platforms'     => $this->breakdown($query, 'platform'),
            'devices'       => $this->breakdown($query, 'device'),
            'enabled'       => (bool) config('traffic.enabled'),
        ];
    }

    private function breakdown(Builder $query, string $column): array
    {
        return (clone $query)->select($column)->selectRaw('COUNT(*) as views')->groupBy($column)
            ->orderByDesc('views')->limit(10)->get()->map(fn (PageView $row): array => [
                'label' => $row->{$column} ?? 'Direct / internal',
                'views' => (int) $row->views,
            ])->all();
    }
}
