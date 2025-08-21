<?php

namespace Modules\Blog\Tables;

use Modules\Blog\Models\Article;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Enums\Variant;
use Modules\Table\Filters;
use Modules\Table\Table;

class Articles extends Table
{
    protected ?string $resource = Article::class;

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', stickable: true)->url(fn(Article $article) => '/blog/articles/' . $article->id . '/edit'),
            Columns\TextColumn::make('title', 'Title', toggleable: false)->searchable(),
            Columns\TextColumn::make('slug', 'Slug', toggleable: false)->sortable(),
            Columns\TextColumn::make('status', 'Status', toggleable: false),
            Columns\DateColumn::make('created_at', 'Created At', toggleable: false),
            Columns\DateColumn::make('updated_at', 'Updated At', toggleable: false),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\TextFilter::make('id', 'ID'),
            Filters\DateFilter::make('created_at'),
            Filters\TrashedFilter::make('deleted_at', 'Trashed'),

            // Example of hidden filter with boolean condition
            Filters\TextFilter::make('author_email', 'Author Email')->hidden(true),

            // Example of hidden filter with closure condition
            Filters\TextFilter::make('meta_title', 'Meta Title')->hidden(fn() => !auth()->user()?->hasRole('admin')),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Delete',
                handle: fn(Article $article) => $article->delete(),
                icon: 'a-arrow-down',
                variant: Variant::Destructive,
            )
                ->confirm()
                ->asBulkAction(),
        ];
    }

    public function exports(): array
    {
        return [
            //
        ];
    }
}
