<?php

namespace Modules\Projects\Tables;

use Modules\Projects\Models\Project;
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
            Columns\TextColumn::make('id', 'ID', stickable: true)->url(fn(Project $project) => route('admin.projects.show', $project)),
            Columns\TextColumn::make('title', 'Title', toggleable: false)
                ->searchable()
                ->sortable(),
            Columns\TextColumn::make('client', 'Client')
                ->searchable()
                ->sortable(),
            Columns\DateColumn::make('start_date', 'Start Date')
                ->sortable(),
            Columns\DateColumn::make('end_date', 'End Date')
                ->sortable(),
            Columns\BadgeColumn::make('status', 'Status')
                ->colors([
                    'success' => 'published',
                    'warning' => 'draft',
                    'secondary' => 'archived',
                ])
                ->sortable(),
            Columns\BooleanColumn::make('featured', 'Featured')
                ->sortable(),
            Columns\TextColumn::make('technologies', 'Technologies')
                ->format(fn($value) => is_array($value) ? implode(', ', array_slice($value, 0, 3)) . (count($value) > 3 ? '...' : '') : ''),
            Columns\DateColumn::make('created_at', 'Created At', toggleable: false),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\TextFilter::make('title', 'Title'),
            Filters\TextFilter::make('client', 'Client'),
            Filters\SelectFilter::make('status', 'Status')
                ->options([
                    'draft' => 'Draft',
                    'published' => 'Published',
                    'archived' => 'Archived',
                ]),
            Filters\BooleanFilter::make('featured', 'Featured'),
            Filters\DateFilter::make('start_date', 'Start Date'),
            Filters\DateFilter::make('end_date', 'End Date'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Edit',
                url: fn(Project $project) => route('admin.projects.edit', $project),
                icon: 'pencil',
                variant: Variant::Secondary,
            ),
            Action::make(
                label: 'View',
                url: fn(Project $project) => route('admin.projects.show', $project),
                icon: 'eye',
                variant: Variant::Secondary,
            ),
            Action::make(
                label: 'Delete',
                handle: function (Project $project) {
                    $project->delete();
                    return back()->with('success', 'Project deleted successfully.');
                },
                icon: 'trash',
                variant: Variant::Destructive,
            )
                ->confirm('Are you sure you want to delete this project?')
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
