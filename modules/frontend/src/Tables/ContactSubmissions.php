<?php

namespace Modules\Frontend\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Modules\Frontend\Models\ContactSubmission;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Enums\Variant;
use Modules\Table\Filters;
use Modules\Table\Table;

class ContactSubmissions extends Table
{
    protected ?string $defaultSort = '-created_at';

    protected ?array $perPageOptions = [25, 50, 100];

    public function resource(): Builder|string
    {
        return ContactSubmission::query()->select([
            'id', 'name', 'email', 'topic', 'subject', 'status', 'created_at',
        ]);
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('name', 'From', toggleable: false)
                ->searchable()
                ->sortable()
                ->url(fn (ContactSubmission $submission) => route('admin.contact.show', $submission)),
            Columns\TextColumn::make('email', 'Email')->searchable(),
            Columns\TextColumn::make('subject', 'Subject', toggleable: false)
                ->searchable()
                ->truncate(56)
                ->url(fn (ContactSubmission $submission) => route('admin.contact.show', $submission)),
            Columns\TextColumn::make('topic', 'Topic')->mapAs(fn (string $value) => str($value)->headline()->toString()),
            Columns\BadgeColumn::make('status', 'Status', toggleable: false)
                ->mapAs(fn (string $value) => str($value)->headline()->toString())
                ->variant([
                    ContactSubmission::STATUS_NEW      => Variant::Success,
                    ContactSubmission::STATUS_READ     => Variant::Secondary,
                    ContactSubmission::STATUS_RESOLVED => Variant::Default,
                ]),
            Columns\DateTimeColumn::make('created_at', 'Received', toggleable: false)->format('d M Y, H:i')->sortable(),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\SetFilter::make('status', 'Status')->options([
                ContactSubmission::STATUS_NEW      => 'New',
                ContactSubmission::STATUS_READ     => 'Read',
                ContactSubmission::STATUS_RESOLVED => 'Resolved',
            ]),
            Filters\SetFilter::make('topic', 'Topic')->options([
                'general'    => 'General question',
                'project'    => 'Project enquiry',
                'consulting' => 'Consulting',
                'visa'       => 'Visa support',
                'speaking'   => 'Speaking invitation',
                'other'      => 'Something else',
            ]),
            Filters\DateFilter::make('created_at', 'Received'),
        ];
    }

    public function actions(): array
    {
        return [
            Action::make(
                label: 'Open',
                url: fn (ContactSubmission $submission) => route('admin.contact.show', $submission),
                icon: 'external-link',
                variant: Variant::Secondary,
            ),
            Action::make(
                label: 'Mark as read',
                handle: fn (ContactSubmission $submission) => $submission->markRead(),
                icon: 'mail-open',
                disabledAndHidden: fn (?ContactSubmission $submission) => $submission !== null && $submission->status !== ContactSubmission::STATUS_NEW,
            )->asBulkAction(),
            Action::make(
                label: 'Mark as unread',
                handle: fn (ContactSubmission $submission) => $submission->markUnread(),
                icon: 'mail',
                disabledAndHidden: fn (?ContactSubmission $submission) => $submission !== null && $submission->status === ContactSubmission::STATUS_NEW,
            )->asBulkAction(),
            Action::make(
                label: 'Resolve',
                handle: fn (ContactSubmission $submission) => $submission->resolve(),
                icon: 'check-circle-2',
                variant: Variant::Success,
                disabledAndHidden: fn (?ContactSubmission $submission) => $submission !== null && $submission->status === ContactSubmission::STATUS_RESOLVED,
            )->asBulkAction(),
            Action::make(
                label: 'Reopen',
                handle: fn (ContactSubmission $submission) => $submission->reopen(),
                icon: 'rotate-ccw',
                disabledAndHidden: fn (?ContactSubmission $submission) => $submission !== null && $submission->status !== ContactSubmission::STATUS_RESOLVED,
            )->asBulkAction(),
        ];
    }
}
