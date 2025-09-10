<?php

namespace Modules\Blog\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Modules\Blog\Models\Tag;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Enums\Variant;
use Modules\Table\Filters;
use Modules\Table\Table;

class Tags extends Table
{
    protected ?string $resource = Tag::class;

    public function resource(): Builder|string
    {
        return Tag::withCount('articles');
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', stickable: true)->url(fn (Tag $tag) => route('admin.tags.edit', $tag->id)),
            Columns\TextColumn::make('name', 'Name', toggleable: false)
                ->searchable()
                ->sortable(),
            Columns\TextColumn::make('slug', 'Slug', toggleable: false)->sortable(),
            Columns\TextColumn::make('articles_count', 'Articles Count')
                ->sortable(),
            Columns\DateColumn::make('created_at', 'Created At', toggleable: false),
            Columns\DateColumn::make('updated_at', 'Updated At', toggleable: false),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\TextFilter::make('id', 'ID'),
            Filters\TextFilter::make('name', 'Name'),
            Filters\DateFilter::make('created_at'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Edit',
                url: fn (Tag $tag) => route('admin.tags.edit', $tag->id),
                icon: 'pencil',
                variant: Variant::Secondary,
            ),
            Action::make(
                label: 'Delete',
                handle: function (Tag $tag) {
                    $tag->articles()->detach();
                    $tag->delete();

                    return back()->with('success', 'Tag deleted successfully.');
                },
                icon: 'trash',
                variant: Variant::Destructive,
            )
                ->confirm('Are you sure you want to delete this tag?')
                ->asBulkAction(),
        ];
    }
}
