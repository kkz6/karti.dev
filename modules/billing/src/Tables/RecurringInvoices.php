<?php

namespace Modules\Billing\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Gate;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\RecurringInvoice;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Filters;
use Modules\Table\Table;

class RecurringInvoices extends Table
{
    protected ?string $defaultSort = '-created_at';

    public function resource(): Builder|string
    {
        Gate::authorize('viewAny', RecurringInvoice::class);
        Gate::authorize('viewAny', Invoice::class);
        Gate::authorize('view', new Invoice);

        return RecurringInvoice::query();
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('name', 'Schedule', toggleable: false)->searchable()->sortable()->url(fn (RecurringInvoice $s) =>Gate::allows('view', $s) ? route('admin.recurring-invoices.edit', $s) : null),
            Columns\DateColumn::make('next_date', 'Next invoice')->sortable(),
            Columns\TextColumn::make('interval', 'Frequency')->mapAs(fn ($v, RecurringInvoice $s) =>'Every '.$s->every.' '.$v.($s->every > 1 ? 's' : '')),
            Columns\TextColumn::make('cycles_done', 'Cycles')->mapAs(fn ($v, RecurringInvoice $s) =>$v.' / '.($s->cycle_limit ?? 'Unlimited'))->sortable(),
            Columns\BadgeColumn::make('active', 'Status')->mapAs(fn ($v) =>$v ? 'Active' : 'Paused')->variant(fn ($v) =>$v ? 'success' : 'warning'),
            Columns\TextColumn::make('policy', 'On generation')->mapAs(fn ($v) =>['draft'=>'Create draft', 'issue'=>'Issue invoice', 'issue_and_send'=>'Issue and email'][$v] ?? $v),
            Columns\TextColumn::make('last_error', 'Last issue'), Columns\ActionColumn::new()];
    }

    public function filters(): array
    {
        return [Filters\SetFilter::make('active', 'Status')->options(['1'=>'Active', '0'=>'Paused']), Filters\SetFilter::make('policy', 'On generation')->options(['draft'=>'Create draft', 'issue'=>'Issue invoice', 'issue_and_send'=>'Issue and email']), Filters\DateFilter::make('next_date', 'Next invoice')];
    }

    public function actions(): array
    {
        return [Action::make('Open', url: fn (RecurringInvoice $s) =>route('admin.recurring-invoices.edit', $s), authorize: fn () => Gate::allows('view', new RecurringInvoice), icon: 'external-link')];
    }

    public function exports(): array
    {
        return [];
    }
}
