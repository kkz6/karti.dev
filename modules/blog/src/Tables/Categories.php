<?php

namespace Modules\Blog\Tables;

use Modules\Blog\Models\Category;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Enums\Variant;
use Modules\Table\Filters;
use Modules\Table\Table;

class Categories extends Table
{
    protected ?string $resource = Category::class;

    public function resource(): \Illuminate\Contracts\Database\Eloquent\Builder|string
    {
        return Category::withCount('articles');
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', stickable: true)->url(fn(Category $category) => route('admin.categories.show', $category)),
            Columns\TextColumn::make('name', 'Name', toggleable: false)
                ->searchable()
                ->sortable(),
            Columns\TextColumn::make('slug', 'Slug', toggleable: false)->sortable(),
            Columns\TextColumn::make('articles_count', 'Articles Count')
                ->sortable(),
            Columns\BooleanColumn::make('is_active', 'Active')
                ->sortable(),
            Columns\DateColumn::make('created_at', 'Created At', toggleable: false),
            Columns\DateColumn::make('updated_at', 'Updated At', toggleable: false),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\TextFilter::make('name', 'Name'),
            Filters\BooleanFilter::make('is_active', 'Active'),
            Filters\DateFilter::make('created_at'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Edit',
                url: fn(Category $category) => route('admin.categories.edit', $category),
                icon: 'pencil',
                variant: Variant::Secondary,
            ),
            Action::make(
                label: 'View',
                url: fn(Category $category) => route('admin.categories.show', $category),
                icon: 'eye',
                variant: Variant::Secondary,
            ),
            Action::make(
                label: 'Delete',
                handle: function (Category $category) {
                    if ($category->articles()->exists()) {
                        return back()->with('error', 'Cannot delete category with existing articles.');
                    }
                    $category->delete();
                    return back()->with('success', 'Category deleted successfully.');
                },
                icon: 'trash',
                variant: Variant::Destructive,
            )
                ->confirm('Are you sure you want to delete this category?')
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
