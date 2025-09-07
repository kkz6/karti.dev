<?php

namespace Modules\Photography\Tables;

use Modules\Photography\Models\PhotoCollection;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Enums\Variant;
use Modules\Table\Filters;
use Modules\Table\Table;

class PhotoCollections extends Table
{
    protected ?string $resource = PhotoCollection::class;

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', stickable: true)->url(fn(PhotoCollection $collection) => route('admin.photography.edit', $collection->id)),
            Columns\TextColumn::make('title', 'Title', toggleable: false)->searchable(),
            Columns\TextColumn::make('slug', 'Slug', toggleable: false)->sortable(),
            Columns\BadgeColumn::make('status', 'Status', toggleable: false),
            Columns\BooleanColumn::make('featured', 'Featured'),
            Columns\TextColumn::make('image_count', 'Photos')->sortable(false),
            Columns\DateColumn::make('published_at', 'Published At'),
            Columns\DateColumn::make('created_at', 'Created At'),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\TextFilter::make('id', 'ID'),
            Filters\SetFilter::make('status', 'Status')->options([
                'draft'     => 'Draft',
                'published' => 'Published',
                'archived'  => 'Archived',
            ]),
            Filters\BooleanFilter::make('featured', 'Featured'),
            Filters\DateFilter::make('created_at', 'Created At'),
            Filters\DateFilter::make('published_at', 'Published At'),
            Filters\TrashedFilter::make('deleted_at', 'Trashed'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Delete',
                handle: fn(PhotoCollection $collection) => $collection->delete(),
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
