<?php

namespace Modules\Billing\Tables;

use Illuminate\Support\Facades\Gate;
use Modules\Billing\Models\Service;
use Modules\Billing\Support\Currencies;
use Modules\Table\Columns;
use Modules\Table\Filters;

class Services extends CatalogueTable
{
    protected string $catalogueModel = Service::class;

    protected string $routePrefix = 'admin.services';

    public function columns(): array
    {
        return [
            Columns\TextColumn::make('name', 'Service', toggleable: false)->searchable()->sortable()->url(fn (Service $service) => Gate::allows('view', $service) ? route('admin.services.show', $service) : null),
            Columns\TextColumn::make('description', 'Description')->truncate(70)->searchable(),
            Columns\TextColumn::make('unit', 'Unit'),
            Columns\TextColumn::make('rate', 'Unit price')->sortable(),
            Columns\TextColumn::make('currency', 'Currency')->sortable(),
            Columns\BadgeColumn::make('archived_at', 'Status')->mapAs(fn ($date) => $date ? 'Archived' : 'Active')->variant(fn ($date) => $date ? 'muted' : 'success'),
            Columns\ActionColumn::new(),
        ];
    }

    public function filters(): array
    {
        return [...parent::filters(), Filters\SetFilter::make('currency', 'Currency')->options(Currencies::codes())];
    }
}
