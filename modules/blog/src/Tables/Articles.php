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
            //
        ];
    }

    public function filters(): array
    {
        return [
            //
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
