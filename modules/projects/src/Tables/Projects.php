<?php

namespace Modules\Projects\Tables;

use Modules\Projects\Models\Project;
use Modules\Shared\Tables\RestoreAction;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Enums\Variant;
use Modules\Table\Filters;
use Modules\Table\Table;

class Projects extends Table
{
    protected ?string $resource = Project::class;

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', stickable: true)->url(fn (Project $project) => $project->trashed() ? null : route('admin.projects.edit', $project)),
            Columns\TextColumn::make('title', 'Title', toggleable: false)
                ->url(fn (Project $project) => $project->trashed() ? null : route('admin.projects.edit', $project))
                ->searchable()
                ->sortable(),
            Columns\BooleanColumn::make('featured', 'Featured')
                ->sortable(),
            Columns\TextColumn::make('technologies', 'Technologies')
                ->mapAs(fn ($value) => is_array($value) ? implode(', ', array_slice($value, 0, 3)).(count($value) > 3 ? '...' : '') : ''),
            Columns\DateColumn::make('created_at', 'Created At', toggleable: false),
            Columns\DateColumn::make('deleted_at', 'Deleted at')->sortable(),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\TrashedFilter::make('deleted_at', 'Trash'),
            Filters\TextFilter::make('title', 'Title'),
            Filters\BooleanFilter::make('featured', 'Featured'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Edit',
                disabledAndHidden: fn (?Project $project) => $project?->trashed() ?? false,
                url: fn (Project $project) => route('admin.projects.edit', $project),
                icon: 'pencil',
                variant: Variant::Secondary,
            ),
            Action::make(
                label: 'Delete',
                disabledAndHidden: fn (?Project $project) => $project?->trashed() ?? false,
                handle: function (Project $project) {
                    $project->delete();

                    return back()->with('success', 'Project deleted successfully.');
                },
                icon: 'trash',
                variant: Variant::Destructive,
            )
                ->confirm('Are you sure you want to delete this project?')
                ->asBulkAction(),
            RestoreAction::make(),
        ];
    }

    public function exports(): array
    {
        return [
            //
        ];
    }
}
