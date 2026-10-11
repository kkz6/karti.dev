<?php

namespace Modules\Billing\Tables;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Modules\Table\Action;
use Modules\Table\Filters;
use Modules\Table\Filters\Clause;
use Modules\Table\Table;

abstract class CatalogueTable extends Table
{
    protected string $catalogueModel;

    protected string $routePrefix;

    protected ?string $defaultSort = 'name';

    public function resource(): Builder|string
    {
        Gate::authorize('viewAny', $this->catalogueModel);

        return $this->catalogueModel::query();
    }

    public function filters(): array
    {
        return [Filters\SetFilter::make('archived_at', 'Status', applyUsing: function (Builder $query, string $attribute, Clause $clause, mixed $value) {
            $value === 'archived' ? $query->whereNotNull('archived_at') : $query->whereNull('archived_at');
        })->options(['active' => 'Active', 'archived' => 'Archived'])->withoutClause()->default('active', Clause::Equals)];
    }

    public function actions(): array
    {
        Gate::authorize('viewAny', $this->catalogueModel);

        return [Action::make('Open', url: fn (Model $record) => route($this->routePrefix.'.show', $record),
            authorize: fn () => Gate::allows('view', new $this->catalogueModel), icon: 'external-link')];
    }

    public function exports(): array
    {
        Gate::authorize('viewAny', $this->catalogueModel);

        return [];
    }
}
