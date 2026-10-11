<?php

namespace Modules\Billing\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Gate;
use Modules\Billing\Models\Customer;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Filters;
use Modules\Table\Filters\Clause;
use Modules\Table\Table;

class Customers extends Table
{
    protected ?string $defaultSort = '-created_at';

    public function resource(): Builder|string
    {
        Gate::authorize('viewAny', Customer::class);

        return Customer::query()->with('primaryContact')->select(['id', 'display_name', 'type', 'phone', 'billing_country', 'archived_at', 'created_at']);
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('id', 'ID', toggleable: false)->sortable(),
            Columns\TextColumn::make('display_name', 'Customer', toggleable: false)->searchable()->sortable()
                ->url(fn (Customer $customer) => Gate::allows('view', $customer) ? route('admin.customers.show', $customer) : null),
            Columns\TextColumn::make('type', 'Type')->mapAs(fn ($type) => ucfirst($type)),
            Columns\TextColumn::make('primaryContact.email', 'Billing email')->searchable(),
            Columns\TextColumn::make('phone', 'Phone')->searchable(),
            Columns\TextColumn::make('billing_country', 'Country'),
            Columns\BadgeColumn::make('archived_at', 'Status')->mapAs(fn ($date) => $date ? 'Archived' : 'Active')->variant(fn ($date) => $date ? 'muted' : 'success'),
            Columns\DateColumn::make('created_at', 'Created')->sortable(),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [
            Filters\SetFilter::make('type', 'Customer type')->options(['business' => 'Business', 'individual' => 'Individual']),
            Filters\SetFilter::make('archived_at', 'Status', applyUsing: function (Builder $query, string $attribute, Clause $clause, mixed $value) {
                $value === 'archived' ? $query->whereNotNull('archived_at') : $query->whereNull('archived_at');
            })->options(['active' => 'Active', 'archived' => 'Archived'])->withoutClause()->default('active', Clause::Equals),
        ];
    }

    public function quickFilters(): array
    {
        return ['type'];
    }

    public function quickFilterLabels(): array
    {
        return ['type'=>'All customer types'];
    }

    public function tabs(): array
    {
        return [
            \Modules\Table\Tab::make('all', 'All')->filters(['archived_at'=>null])->icon('layout-grid')->countUsing(fn (Builder $q) => $q->count()),
            \Modules\Table\Tab::make('active', 'Active')->filters(['archived_at'=>'active'])->icon('circle-check')->tone('success')->countUsing(fn (Builder $q) => $q->whereNull('archived_at')->count()),
            \Modules\Table\Tab::make('archived', 'Archived')->filters(['archived_at'=>'archived'])->icon('archive')->countUsing(fn (Builder $q) => $q->whereNotNull('archived_at')->count()),
        ];
    }

    public function actions(): array
    {
        Gate::authorize('viewAny', Customer::class);

        return [Action::make('Open', url: fn (Customer $customer) => route('admin.customers.show', $customer),
            authorize: fn () => Gate::allows('view', new Customer), icon: 'external-link')];
    }

    public function exports(): array
    {
        Gate::authorize('viewAny', Customer::class);

        return [];
    }
}
