<?php

namespace Modules\Speaking\Tables;

use Modules\Speaking\Models\SpeakingEvent;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Enums\Variant;
use Modules\Table\Filters;
use Modules\Table\Table;

class SpeakingEvents extends Table
{
    protected ?string $resource = SpeakingEvent::class;

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', stickable: true)->url(fn(SpeakingEvent $event) => route('admin.speaking.show', $event)),
            Columns\TextColumn::make('title', 'Title', toggleable: false)
                ->searchable()
                ->sortable(),
            Columns\TextColumn::make('event_name', 'Event', toggleable: false)
                ->searchable()
                ->sortable(),
            Columns\BadgeColumn::make('event_type', 'Type')
                ->colors([
                    'primary' => 'conference',
                    'success' => 'podcast',
                    'warning' => 'workshop',
                    'info' => 'webinar',
                ])
                ->sortable(),
            Columns\DateColumn::make('event_date', 'Date')
                ->sortable(),
            Columns\TextColumn::make('location', 'Location'),
            Columns\BooleanColumn::make('featured', 'Featured')
                ->sortable(),
            Columns\BadgeColumn::make('status', 'Status')
                ->colors([
                    'success' => 'published',
                    'warning' => 'draft',
                    'secondary' => 'archived',
                ])
                ->sortable(),
            Columns\DateColumn::make('created_at', 'Created At', toggleable: false),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\TextFilter::make('title', 'Title'),
            Filters\TextFilter::make('event_name', 'Event Name'),
            Filters\SelectFilter::make('event_type', 'Type')
                ->options([
                    'conference' => 'Conference',
                    'podcast' => 'Podcast',
                    'workshop' => 'Workshop',
                    'webinar' => 'Webinar',
                ]),
            Filters\SelectFilter::make('status', 'Status')
                ->options([
                    'draft' => 'Draft',
                    'published' => 'Published',
                    'archived' => 'Archived',
                ]),
            Filters\BooleanFilter::make('featured', 'Featured'),
            Filters\DateFilter::make('event_date', 'Event Date'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Edit',
                url: fn(SpeakingEvent $event) => route('admin.speaking.edit', $event),
                icon: 'pencil',
                variant: Variant::Secondary,
            ),
            Action::make(
                label: 'View',
                url: fn(SpeakingEvent $event) => route('admin.speaking.show', $event),
                icon: 'eye',
                variant: Variant::Secondary,
            ),
            Action::make(
                label: 'Delete',
                handle: function (SpeakingEvent $event) {
                    $event->delete();
                    return back()->with('success', 'Speaking event deleted successfully.');
                },
                icon: 'trash',
                variant: Variant::Destructive,
            )
                ->confirm('Are you sure you want to delete this speaking event?')
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
