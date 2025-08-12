<?php

namespace Modules\Blog\Tables;

use Modules\Blog\Models\Article;
use Modules\Table\Table;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Export;
use Modules\Table\Filters;
use Modules\Table\Url;

class Articles extends Table
{
    protected ?string $resource = Article::class;

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', toggleable: false)->url(fn(Article $article) => '/blog/articles/' . $article->id . '/edit'),
            Columns\TextColumn::make('title', 'Title', toggleable: false)->searchable(),
            Columns\TextColumn::make('slug', 'Slug', toggleable: false),
            Columns\TextColumn::make('status', 'Status', toggleable: false),
            Columns\TextColumn::make('created_at', 'Created At', toggleable: false),
            Columns\TextColumn::make('updated_at', 'Updated At', toggleable: false),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\TextFilter::make('id', 'ID'),
            Filters\DateFilter::make('created_at'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Delete',
                handle: fn(Article $article) => $article->delete(),
            )->confirm(),
        ];
    }

    public function exports(): array
    {
        return [
            //
        ];
    }
}
