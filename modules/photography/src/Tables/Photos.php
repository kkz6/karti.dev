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
    protected ?string $resource = Photo::class;

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', stickable: true),
            Columns\ImageColumn::make('cover_image_thumbnail', 'Cover'),
            Columns\TextColumn::make('title', 'Title', toggleable: false)->searchable(),
            Columns\TextColumn::make('slug', 'Slug')->searchable(),
            Columns\TextColumn::make('image_count', 'Images')->mapAs(function ($state) {
                return $state.' '.($state === 1 ? 'image' : 'images');
            }),
            Columns\BooleanColumn::make('featured', 'Featured'),
            Columns\NumericColumn::make('sort_order', 'Order')->sortable(),
            Columns\DateColumn::make('published_at', 'Published'),
            Columns\DateColumn::make('created_at', 'Created'),
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
                url: fn (Photo $photo) => route('admin.photography.edit', $photo),
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
