<?php

namespace Modules\Blog\Tables;

use Modules\Blog\Models\Article;
use Modules\Table\Table;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Export;
use Modules\Table\Filters;

class Articles extends Table
{
    protected ?string $resource = Article::class;

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', toggleable: false),
            Columns\TextColumn::make('title', 'Title', toggleable: false),
            Columns\TextColumn::make('slug', 'Slug', toggleable: false),
            Columns\TextColumn::make('status', 'Status', toggleable: false),
            Columns\TextColumn::make('created_at', 'Created At', toggleable: false),
            Columns\TextColumn::make('updated_at', 'Updated At', toggleable: false),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\TextFilter::make('id', 'ID'),
        ];
    }

    public function actions(): array
    {
        return [
            //
        ];
    }

    public function exports(): array
    {
        return [
            //
        ];
    }
}
