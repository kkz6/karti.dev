<?php

namespace Modules\Photography\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Modules\Photography\Models\Photo;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Enums\Variant;
use Modules\Table\Filters;
use Modules\Table\Table;

class Photos extends Table
{
    protected ?string $resource = Photo::class;

    protected ?int $collectionId = null;

    public function setCollectionId(int $collectionId): self
    {
        $this->collectionId = $collectionId;
        return $this;
    }

    public function resource(): Builder|string
    {
        if ($this->collectionId) {
            return Photo::where('photo_collection_id', $this->collectionId);
        }

        return parent::resource();
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', stickable: true),
            Columns\ImageColumn::make('image_path', 'Image')->width(60)->height(60),
            Columns\TextColumn::make('title', 'Title', toggleable: false)->searchable(),
            Columns\TextColumn::make('alt_text', 'Alt Text'),
            Columns\NumericColumn::make('sort_order', 'Order')->sortable(),
            Columns\TextColumn::make('width', 'Dimensions')->formatStateUsing(function ($state, Photo $photo) {
                if ($photo->width && $photo->height) {
                    return $photo->width . ' × ' . $photo->height;
                }
                return '—';
            }),
            Columns\TextColumn::make('file_size', 'Size')->formatStateUsing(function ($state) {
                if ($state) {
                    return $this->formatBytes($state);
                }
                return '—';
            }),
            Columns\DateColumn::make('created_at', 'Created At'),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\TextFilter::make('id', 'ID'),
            Filters\TextFilter::make('title', 'Title'),
            Filters\DateFilter::make('created_at', 'Created At'),
            Filters\TrashedFilter::make('deleted_at', 'Trashed'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Delete',
                handle: fn(Photo $photo) => $photo->delete(),
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

    private function formatBytes(int $size, int $precision = 2): string
    {
        $base = log($size, 1024);
        $suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];

        return round(pow(1024, $base - floor($base)), $precision) . ' ' . $suffixes[floor($base)];
    }
}
