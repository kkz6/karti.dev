<?php

namespace Modules\Blog\Tables;

use Modules\Blog\Models\Article;
use Modules\Shared\Tables\RestoreAction;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Enums\Variant;
use Modules\Table\Filters;
use Modules\Table\Table;

class Articles extends Table
{
    public function resource(): \Illuminate\Contracts\Database\Eloquent\Builder|string
    {
        return app(\Modules\Analytics\Services\ContentTraffic::class)->withViewCount(Article::query(), 'article');
    }

    protected ?string $resource = Article::class;

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', stickable: true)
                ->url(fn (Article $article) => $article->trashed() ? null : route('admin.blog.edit', ['blog' => $article->id])),
            Columns\TextColumn::make('title', 'Title', toggleable: false)
                ->url(fn (Article $article) => $article->trashed() ? null : route('admin.blog.edit', ['blog' => $article->id]))->searchable(),
            Columns\TextColumn::make('slug', 'Slug', toggleable: false)
                ->url(fn (Article $article) => $article->trashed() ? null : route('admin.blog.edit', ['blog' => $article->id]))->sortable(),
            Columns\BadgeColumn::make('status', 'Status', toggleable: false)
                ->variant([
                    'published' => Variant::Success,
                    'draft'     => Variant::Warning,
                    'archived'  => Variant::Secondary,
                ]),
            Columns\DateColumn::make('created_at', 'Created At', toggleable: false),
            Columns\NumericColumn::make('local_views', 'Views (30d)')->sortable()
                ->url(fn (Article $article) => $article->trashed() ? null : route('admin.seo.content', ['type' => 'article', 'id' => $article->id])),
            Columns\DateColumn::make('updated_at', 'Updated At', toggleable: false),
            Columns\DateColumn::make('deleted_at', 'Deleted at')->sortable(),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\SetFilter::make('status', 'Status')->options(['published' => 'Published', 'draft' => 'Draft', 'archived' => 'Archived']),
            Filters\TextFilter::make('id', 'ID'),
            Filters\DateFilter::make('created_at'),
            Filters\TrashedFilter::make('deleted_at', 'Trash'),
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
