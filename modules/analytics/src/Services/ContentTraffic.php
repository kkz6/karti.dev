<?php

namespace Modules\Analytics\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Modules\Analytics\Models\PageView;
use Modules\Blog\Models\Article;
use Modules\Photography\Models\Photo;

class ContentTraffic
{
    public function identify(Request $request): array
    {
        $type = match ($request->route()?->getName()) {
            'articles.show', 'article' => 'article',
            'photography.show' => 'gallery',
            default            => null,
        };
        if (! $type) {
            return [];
        }

        $id = $this->model($type)::query()->where('slug', $request->route('slug'))->value('id');

        return $id ? ['content_type' => $type, 'content_id' => $id] : [];
    }

    /** @return class-string<Model> */
    public function model(string $type): string
    {
        return match ($type) {
            'article' => Article::class,
            'gallery' => Photo::class,
            default   => abort(404),
        };
    }

    public function query(string $type, int $id): Builder
    {
        return PageView::query()->where('content_type', $type)->where('content_id', $id);
    }

    public function forContent(string $type, Model $entry): array
    {
        return $this->summary($this->query($type, $entry->getKey()), $entry->title,
            route('admin.seo.content', ['type' => $type, 'id' => $entry->getKey()]), false);
    }

    public function forPage(string $path, string $title): array
    {
        return $this->summary(PageView::query()->where('path', $path), $title,
            route('admin.seo.page', ['path' => $path]), true);
    }

    private function summary(Builder $query, string $title, string $url, bool $sharedPage): array
    {
        $totals = $query->whereBetween('viewed_on', [now('UTC')->subDays(29)->toDateString(), now('UTC')->toDateString()])
            ->selectRaw('COUNT(*) as views, COUNT(DISTINCT visitor_hash) as visitors')->first();

        return [
            'title' => $title, 'views' => (int) $totals->views, 'dailyVisitors' => (int) $totals->visitors,
            'days'  => 30, 'enabled' => (bool) config('traffic.enabled'), 'url' => $url, 'sharedPage' => $sharedPage,
        ];
    }

    public function withViewCount(Builder $query, string $type): Builder
    {
        // One indexed aggregate subquery, not a separate query for every table row.
        $table = $query->getModel()->getTable();

        return $query->select($table.'.*')->selectSub(
            PageView::query()->selectRaw('COUNT(*)')->where('content_type', $type)->whereColumn('content_id', $table.'.id')
                ->whereBetween('viewed_on', [now('UTC')->subDays(29)->toDateString(), now('UTC')->toDateString()]),
            'local_views'
        );
    }
}
