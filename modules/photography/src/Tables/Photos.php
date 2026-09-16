<?php

namespace Modules\Photography\Tables;

use Modules\Photography\Models\Photo;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Enums\Variant;
use Modules\Table\Filters;
use Modules\Table\Table;

class Photos extends Table
{
    public function resource(): \Illuminate\Contracts\Database\Eloquent\Builder|string
    {
        return app(\Modules\Analytics\Services\ContentTraffic::class)->withViewCount(Photo::query(), 'gallery');
    }

    protected ?string $resource = Photo::class;

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', stickable: true)
                ->url(fn (Photo $photo) => route('admin.photography.edit', $photo->id)),
            Columns\TextColumn::make('title', 'Title', toggleable: false)
                ->url(fn (Photo $photo) => route('admin.photography.edit', $photo->id))
                ->searchable(),
            Columns\TextColumn::make('slug', 'Slug')->searchable(),
            Columns\BooleanColumn::make('featured', 'Featured'),
            Columns\NumericColumn::make('sort_order', 'Order')->sortable(),
            Columns\DateColumn::make('published_at', 'Published'),
            Columns\DateColumn::make('created_at', 'Created'),
            Columns\NumericColumn::make('local_views', 'Views (30d)')->sortable()
                ->url(fn (Photo $photo) => route('admin.seo.content', ['type' => 'gallery', 'id' => $photo->id])),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\TextFilter::make('id', 'ID'),
            Filters\TextFilter::make('title', 'Title'),
            Filters\BooleanFilter::make('featured', 'Featured'),
            Filters\DateFilter::make('published_at', 'Published At'),
            Filters\DateFilter::make('created_at', 'Created At'),
            Filters\TrashedFilter::make('deleted_at', 'Trashed'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Edit',
                url: fn (Photo $photo) => route('admin.photography.edit', $photo->id),
                icon: 'pencil',
            ),
            Action::make(
                label: 'Delete',
                handle: fn (Photo $photo) => $photo->delete(),
                icon: 'trash-2',
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
