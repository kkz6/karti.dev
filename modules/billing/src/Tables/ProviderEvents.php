<?php

namespace Modules\Billing\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Modules\Billing\Jobs\ProcessProviderEvent;
use Modules\Billing\Models\ProviderEvent;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Filters;
use Modules\Table\Table;

class ProviderEvents extends Table
{
    protected ?string $defaultSort = '-created_at';

    public function resource(): Builder|string
    {
        abort_unless(auth()->user()->hasRole('super-admin') || auth()->user()->can('view payment reconciliation'), 403);

        return ProviderEvent::query();
    }

    public function columns(): array
    {
        return [Columns\TextColumn::make('event_type', 'Event', toggleable: false)->searchable()->sortable(),
            Columns\BadgeColumn::make('state', 'Status')->mapAs(fn ($v) =>ucfirst(str_replace('_', ' ', $v)))->variant(['paid'=>'success', 'confirmed'=>'success', 'needs_review'=>'warning', 'failed'=>'destructive', 'pending'=>'warning', 'ignored'=>'outline']),
            Columns\TextColumn::make('error', 'Review notes'), Columns\DateTimeColumn::make('created_at', 'Received')->sortable(), Columns\ActionColumn::new()];
    }

    public function filters(): array
    {
        return [Filters\SetFilter::make('state', 'Status')->options(['pending'=>'Pending', 'paid'=>'Paid', 'confirmed'=>'Confirmed', 'failed'=>'Failed', 'needs_review'=>'Needs review', 'ignored'=>'Ignored']), Filters\DateFilter::make('created_at', 'Received')];
    }

    public function actions(): array
    {
        return [Action::make('Retry verification', handle: function (ProviderEvent $e) {
            abort_unless(in_array($e->state, ['failed', 'pending'], true), 409);
            ProcessProviderEvent::dispatch($e->id)->onQueue('billing');
        }, authorize: fn () => auth()->user()->hasRole('super-admin') || auth()->user()->can('view payment reconciliation'), icon: 'refresh-cw')->disabledAndHidden(fn (ProviderEvent $e) => ! in_array($e->state, ['failed', 'pending'], true))];
    }

    public function exports(): array
    {
        return [];
    }
}
