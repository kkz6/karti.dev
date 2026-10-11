<?php

namespace Modules\Billing\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Modules\Billing\Models\ImportBatch;
use Modules\Table\Action;
use Modules\Table\Columns;
use Modules\Table\Filters;
use Modules\Table\Table;

class ImportBatches extends Table
{
    protected ?string $defaultSort = '-created_at';

    public function resource(): Builder|string
    {
        abort_unless(auth()->user()->hasRole('super-admin') || auth()->user()->can('import billing data'), 403);

        return ImportBatch::query();
    }

    public function columns(): array
    {
        return [Columns\TextColumn::make('source', 'Source', toggleable: false)->searchable()->sortable()->url(fn (ImportBatch $b) =>route('admin.billing.imports.show', $b)), Columns\BadgeColumn::make('state', 'Status')->mapAs(fn ($v) =>ucfirst(str_replace('_', ' ', $v)))->variant(['imported'=>'success', 'reviewed'=>'secondary', 'staged'=>'secondary']), Columns\DateTimeColumn::make('created_at', 'Validated')->sortable(), Columns\DateTimeColumn::make('imported_at', 'Imported')->sortable(), Columns\ActionColumn::new()];
    }

    public function filters(): array
    {
        return [Filters\SetFilter::make('state', 'Status')->options(['reviewed'=>'Reviewed', 'imported'=>'Imported'])];
    }

    public function actions(): array
    {
        return [Action::make('Review', url: fn (ImportBatch $b) =>route('admin.billing.imports.show', $b), icon: 'external-link')];
    }

    public function exports(): array
    {
        return [];
    }
}
