<?php

namespace Modules\Frontend\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Modules\Frontend\Models\NewsletterSubscriber;
use Modules\Table\Columns;
use Modules\Table\Filters\Clause;
use Modules\Table\Filters\SetFilter;
use Modules\Table\Table;

class NewsletterSubscribers extends Table
{
    protected ?string $defaultSort = '-created_at';

    protected ?array $perPageOptions = [25, 50, 100];

    public function resource(): Builder|string
    {
        return NewsletterSubscriber::query()->select([
            'id', 'email', 'confirmed_at', 'unsubscribed_at', 'confirmation_sent_at', 'created_at',
        ]);
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('email', 'Email', toggleable: false)->searchable()->sortable(),
            Columns\TextColumn::make('status', 'Status')->mapAs(
                fn ($value, NewsletterSubscriber $subscriber) => $subscriber->unsubscribed_at
                    ? 'Unsubscribed'
                    : ($subscriber->confirmed_at ? 'Active' : 'Pending')
            ),
            Columns\TextColumn::make('confirmation_sent_at', 'Confirmation email')
                ->mapAs(fn ($value) => $value ? 'Sent' : 'Queued / not sent'),
            Columns\DateColumn::make('created_at', 'Created')->format('d/m/Y')->sortable(),
        ];
    }

    public function filters(): array
    {
        return [
            SetFilter::make('status', 'Status')
                ->options(['active' => 'Active', 'pending' => 'Pending', 'unsubscribed' => 'Unsubscribed'])
                ->withoutClause()
                ->applyUsing(function (Builder $query, string $attribute, Clause $clause, mixed $value): void {
                    match ($value) {
                        'active'       => $query->whereNotNull('confirmed_at')->whereNull('unsubscribed_at'),
                        'pending'      => $query->whereNull('confirmed_at')->whereNull('unsubscribed_at'),
                        'unsubscribed' => $query->whereNotNull('unsubscribed_at'),
                        default        => null,
                    };
                }),
        ];
    }
}
