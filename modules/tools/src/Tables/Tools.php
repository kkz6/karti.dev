<?php

namespace Modules\Tools\Tables;

use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Enums\Variant;
use Modules\Table\Filters;
use Modules\Table\Table;
use Modules\Tools\Models\Tool;

class Tools extends Table
{
    protected ?string $resource = Tool::class;

    public function resource(): \Illuminate\Contracts\Database\Eloquent\Builder|string
    {
        return Tool::with('category');
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', stickable: true)->url(fn(Tool $tool) => route('admin.tools.show', $tool)),
            Columns\TextColumn::make('title', 'Title', toggleable: false)
                ->searchable()
                ->sortable(),
            Columns\TextColumn::make('slug', 'Slug', toggleable: false)->sortable(),
            Columns\TextColumn::make('category.name', 'Category')
                ->sortable('tool_category_id'),
            Columns\TextColumn::make('url', 'URL')
                ->url(fn(Tool $tool) => $tool->url),
            Columns\BooleanColumn::make('featured', 'Featured')
                ->sortable(),
            Columns\DateColumn::make('created_at', 'Created At', toggleable: false),
            Columns\DateColumn::make('updated_at', 'Updated At', toggleable: false),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\TextFilter::make('title', 'Title'),
            Filters\BooleanFilter::make('featured', 'Featured'),
            Filters\DateFilter::make('created_at'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Edit',
                url: fn(Tool $tool) => route('admin.tools.edit', $tool),
                icon: 'pencil',
                variant: Variant::Secondary,
            ),
            Action::make(
                label: 'View',
                url: fn(Tool $tool) => route('admin.tools.show', $tool),
                icon: 'eye',
                variant: Variant::Secondary,
            ),
            Action::make(
                label: 'Delete',
                handle: function (Tool $tool) {
                    $tool->delete();
                    return back()->with('success', 'Tool deleted successfully.');
                },
                icon: 'trash',
                variant: Variant::Destructive,
            )
                ->confirm('Are you sure you want to delete this tool?')
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
