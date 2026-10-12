<?php

namespace Modules\Billing\Tables;

use Illuminate\Support\Facades\Gate;
use Modules\Billing\Models\TaxRate;
use Modules\Table\Action;
use Modules\Table\Columns;

class TaxRates extends CatalogueTable
{
    protected string $catalogueModel = TaxRate::class;

    protected string $routePrefix = 'admin.tax-rates';

    public function actions(): array
    {
        Gate::authorize('viewAny', TaxRate::class);

        return [
            Action::make('View', authorize: fn () => Gate::allows('view', new TaxRate), icon: 'eye'),
            Action::make('Edit', authorize: fn () => Gate::allows('update', new TaxRate), hidden: fn (TaxRate $tax) => $tax->archived_at !== null, icon: 'pencil'),
            Action::make('Archive', authorize: fn () => Gate::allows('archive', new TaxRate), hidden: fn (TaxRate $tax) => $tax->archived_at !== null, icon: 'archive'),
            Action::make('Restore', authorize: fn () => Gate::allows('restore', new TaxRate), hidden: fn (TaxRate $tax) => $tax->archived_at === null, icon: 'archive-restore'),
            Action::make('Delete', authorize: fn () => Gate::allows('delete', new TaxRate), icon: 'trash-2'),
        ];
    }

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('name', 'Tax preset', toggleable: false)->searchable()->sortable(),
            Columns\TextColumn::make('percentage', 'Rate')->rightAligned()->cellClass('tabular-nums')->mapAs(fn ($rate) => rtrim(rtrim($rate, '0'), '.').'%')->sortable(),
            Columns\BadgeColumn::make('archived_at', 'Status')->mapAs(fn ($date) => $date ? 'Archived' : 'Active')->variant(fn ($date) => $date ? 'muted' : 'success'),
            Columns\ActionColumn::new(),
        ];
    }
}
