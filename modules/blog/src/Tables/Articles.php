<?php

namespace Modules\Blog\Tables;

use Modules\Blog\Models\Article;
use Modules\Shared\Tables\HasTrashColumns;
use Modules\Shared\Tables\RestoreAction;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Enums\Variant;
use Modules\Table\Filters;
use Modules\Table\Table;

class Articles extends Table
{
    use HasTrashColumns;

    protected ?string $defaultSort = '-created_at';

    public function resource(): \Illuminate\Contracts\Database\Eloquent\Builder|string
    {
        return app(\Modules\Analytics\Services\ContentTraffic::class)->withViewCount(Article::query()->with('user:id,name'), 'article');
    }

    protected ?string $resource = Article::class;

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('title', 'Title', toggleable: false)->searchable()->sortable()->wrap()
                ->url(fn (Article $article) => $article->trashed() ? null : route('admin.blog.edit', ['blog' => $article->id])),
            Columns\BadgeColumn::make('author_name', 'Author')->variant(fn () => Variant::Outline)
                ->mapAs(fn ($name, Article $article) => $name ?: ($article->user?->name ?? '—')),
            Columns\DateColumn::make('created_at', 'Date', toggleable: false)->sortable(),
            ...$this->deletionDateColumns(),
            Columns\TextColumn::make('id', 'ID')->hidden()->sortable(),
            Columns\TextColumn::make('slug', 'Slug')->hidden()->searchable()->sortable(),
            Columns\BadgeColumn::make('status', 'Status')->hidden()->variant([
                'published' => Variant::Success, 'draft' => Variant::Warning, 'archived' => Variant::Secondary,
            ]),
            Columns\NumericColumn::make('local_views', 'Views (30d)')->hidden()->sortable()
                ->url(fn (Article $article) => $article->trashed() ? null : route('admin.seo.content', ['type' => 'article', 'id' => $article->id])),
            Columns\ActionColumn::new(asDropdown: true),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\SetFilter::make('status', 'Status')->options(['published' => 'Published', 'draft' => 'Draft', 'archived' => 'Archived']),
            Filters\TextFilter::make('id', 'ID'),
            Filters\DateFilter::make('created_at'),
            Filters\TrashedFilter::make('deleted_at', 'Trashed'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Delete',
                disabledAndHidden: fn (?Article $article) => $article?->trashed() ?? false,
                handle: fn (Article $article) => $article->delete(),
                icon: 'trash-2',
                variant: Variant::Destructive,
            )
                ->confirm()
                ->asBulkAction(),
            RestoreAction::make(),
        ];
    }

    public function exports(): array
    {
        return [
            //
        ];
    }
}
