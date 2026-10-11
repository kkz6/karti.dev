<?php

namespace Modules\Billing\Tables;

use Illuminate\Support\Facades\Gate;
use Modules\Billing\Models\TaxRate;
use Modules\Table\Columns;

class TaxRates extends CatalogueTable
{
    protected string $catalogueModel = TaxRate::class;

    protected string $routePrefix = 'admin.tax-rates';

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('name', 'Tax preset', toggleable: false)->searchable()->sortable()->url(fn (TaxRate $tax) => Gate::allows('view', $tax) ? route('admin.tax-rates.show', $tax) : null),
            Columns\TextColumn::make('percentage', 'Rate')->mapAs(fn ($rate) => rtrim(rtrim($rate, '0'), '.').'%')->sortable(),
            Columns\BadgeColumn::make('archived_at', 'Status')->mapAs(fn ($date) => $date ? 'Archived' : 'Active')->variant(fn ($date) => $date ? 'muted' : 'success'),
            Columns\ActionColumn::new(),
        ];
    }
}
