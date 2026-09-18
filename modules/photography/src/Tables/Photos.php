<?php

namespace Modules\Photography\Tables;

use Modules\Photography\Models\Photo;
use Modules\Shared\Tables\RestoreAction;
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
                ->url(fn (Photo $photo) => $photo->trashed() ? null : route('admin.photography.edit', $photo->id)),
            Columns\TextColumn::make('title', 'Title', toggleable: false)
                ->url(fn (Photo $photo) => $photo->trashed() ? null : route('admin.photography.edit', $photo->id))
                ->searchable(),
            Columns\TextColumn::make('slug', 'Slug')->searchable(),
            Columns\BooleanColumn::make('featured', 'Featured'),
            Columns\NumericColumn::make('sort_order', 'Order')->sortable(),
            Columns\DateColumn::make('published_at', 'Published'),
            Columns\DateColumn::make('created_at', 'Created'),
            Columns\NumericColumn::make('local_views', 'Views (30d)')->sortable()
                ->url(fn (Photo $photo) => $photo->trashed() ? null : route('admin.seo.content', ['type' => 'gallery', 'id' => $photo->id])),
            Columns\DateColumn::make('deleted_at', 'Deleted at')->sortable(),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\SetFilter::make('status', 'Status')->options(['published' => 'Published', 'draft' => 'Draft', 'archived' => 'Archived']),
            Filters\TextFilter::make('id', 'ID'),
            Filters\TextFilter::make('title', 'Title'),
            Filters\BooleanFilter::make('featured', 'Featured'),
            Filters\DateFilter::make('published_at', 'Published At'),
            Filters\DateFilter::make('created_at', 'Created At'),
            Filters\TrashedFilter::make('deleted_at', 'Trash'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Edit',
                disabledAndHidden: fn (?Photo $photo) => $photo?->trashed() ?? false,
                url: fn (Photo $photo) => route('admin.photography.edit', $photo->id),
                icon: 'pencil',
            ),
            Action::make(
                label: 'Delete',
                disabledAndHidden: fn (?Photo $photo) => $photo?->trashed() ?? false,
                handle: fn (Photo $photo) => $photo->delete(),
                icon: 'trash-2',
                variant: Variant::Destructive,
            )
                ->confirm()
                ->asBulkAction(),
            RestoreAction::make(),
            Action::make(
                label: 'Delete permanently',
                handle: fn (Photo $photo) => $photo->forceDelete(),
                icon: 'trash-2',
                variant: Variant::Destructive,
                authorize: fn () => auth()->check(),
                disabledAndHidden: fn (?Photo $photo) => $photo !== null && ! $photo->trashed(),
            )
                ->withTrashed()
                ->confirm(
                    'Permanently delete selected galleries?',
                    'This cannot be undone. The selected trashed galleries and their details will be removed. Images in the media library will be kept.',
                    'Delete permanently',
                )
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
