<?php

declare(strict_types=1);

namespace Modules\Table;

use Closure;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Contracts\Pagination\Paginator;
use Illuminate\Database\Connection;
use Illuminate\Database\ConnectionResolverInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Pagination\AbstractCursorPaginator;
use Illuminate\Pagination\AbstractPaginator;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Modules\Table\Columns\ActionColumn;
use Modules\Table\Columns\Column;
use Modules\Table\Filters\Clause;
use Modules\Table\Filters\FilterRequest;
use Throwable;

class QueryBuilder
{
    public function __construct(
        protected readonly Table $table,
        protected readonly TableRequest $tableRequest,
        protected ?Closure $searchUsing = null,
    ) {}

    /**
     * Create a new QueryBuilder instance for the given Table.
     */
    public static function from(Table $table): self
    {
        return new static($table, $table->getTableRequest());
    }

    /**
     * Set a callback to specify how the search should be applied.
     */
    public function searchUsing(Closure|callable $searchUsing): self
    {
        $this->searchUsing = Helpers::asClosure($searchUsing);

        return $this;
    }

    /**
     * Determine if the Table has a custom search implementation.
     */
    public function hasCustomSearch(): bool
    {
        return $this->searchUsing instanceof Closure;
    }

    /**
     * Resolve the resource from the Table instance.
     */
    public function getResource(): Builder
    {
        return $this->table->resourceBuilder();
    }

    /**
     * Split the given terms into an array of search terms, but don't
     * split terms that are wrapped in quotes. Also, remove empty
     * terms from the resulting array.
     */
    public function parseTermsIntoCollection(string $terms): Collection
    {
        return Collection::make(str_getcsv($terms, ' ', '"'))
            ->reject(static fn ($term = null): bool => is_null($term) || trim($term) === '')
            ->values();
    }

    /**
     * Apply eager loading to the query based on the columns that query relationships.
     */
    public function applyEagerLoading(Builder $query): void
    {
        $sortedColumn  = $this->tableRequest->sortedColumn();
        $sortDirection = $this->tableRequest->sortDirection()?->value ?? 'asc';

        collect($this->table->buildColumns())
            ->filter(static fn (Column $column): bool => $column->isNested())
            ->each(function (Column $column) use ($query, $sortedColumn, $sortDirection): void {
                $isSorted = $column->is($sortedColumn);

                $query->with(
                    $column->relationshipName(),
                    fn (Relation $relation) => $isSorted ? $relation->orderBy(
                        $column->relationshipColumn(),
                        $sortDirection
                    ) : null
                );
            });
    }

    /**
     * Apply the search term(s) to the query.
     */
    public function applySearch(Builder $query): void
    {
        $search = $this->tableRequest->search();

        $terms = blank($search) ? collect() : $this->parseTermsIntoCollection($search);

        if ($this->hasCustomSearch()) {
            call_user_func($this->searchUsing, $query, $search ?? '', $terms);

            return;
        }

        if ($terms->isEmpty()) {
            return;
        }

        $columns = collect($this->table->search())->filter()->all();

        if (empty($columns)) {
            return;
        }

        $terms->each(function ($term) use ($query, $columns): void {
            $term = sprintf('%%%s%%', $term);

            $query->where(function (Builder $nestedWhere) use ($term, $columns): void {
                foreach ($columns as $column) {
                    if (! Str::contains($column, '.')) {
                        $nestedWhere->orWhere(
                            $nestedWhere->qualifyColumn($column),
                            static::getWhereLikeOperator($nestedWhere),
                            $term
                        );

                        continue;
                    }

                    $relationName   = Str::beforeLast($column, '.');
                    $relationColumn = Str::afterLast($column, '.');

                    if (! static::isRelatedThroughAnotherConnection($nestedWhere->getModel(), $relationName)) {
                        $nestedWhere->orWhereHas($relationName, fn (Builder $query) => $query->where(
                            $query->qualifyColumn($relationColumn),
                            static::getWhereLikeOperator($query),
                            $term
                        ));

                        continue;
                    }

                    $nestedWhere->orWhere(
                        fn (Builder $query) => RelationOnAnotherConnection::make(
                            $nestedWhere,
                            $column,
                            fn (Builder $builder) => $builder->where(
                                $builder->qualifyColumn($relationColumn),
                                static::getWhereLikeOperator($nestedWhere->getModel()->{$relationName}()->getQuery()),
                                $term
                            ),
                            Clause::Contains,
                            $term
                        )->apply($query)
                    );
                }
            });
        });
    }

    /**
     * Apply the filters to the query.
     */
    public function applyFilter(Builder $query): void
    {
        collect($this->tableRequest->filters())
            ->filter(static fn (FilterRequest $filterRequest): bool => $filterRequest->enabled)
            ->whenNotEmpty(static function (Collection $filters) use ($query): void {
                [$unwrapped, $wrapped] = $filters->partition(
                    static fn (FilterRequest $filterRequest): bool => $filterRequest->filter->shouldBeAppliedUnwrapped()
                );

                $unwrapped->each(static fn (FilterRequest $filterRequest) => $filterRequest->apply($query));

                $query->where(static function (Builder $builder) use ($wrapped): void {
                    $wrapped->each(static fn (FilterRequest $filterRequest) => $filterRequest->apply($builder));
                });
            });
    }

    /**
     * Apply the sort to the query.
     */
    public function applySort(Builder $resource): void
    {
        if (! ($column = $this->tableRequest->sortedColumn()) instanceof Column) {
            return;
        }

        $column->applySort($resource, $this->tableRequest->sortDirection() ?? SortDirection::Ascending);
    }

    /**
     * Get the resource with the request applied.
     */
    public function getResourceWithRequestApplied(bool $applySort = true): Builder
    {
        return tap($this->getResource(), function (Builder $resource) use ($applySort): void {
            $this->applySearch($resource);
            $this->applyFilter($resource);
            $this->applyEagerLoading($resource);
            if ($applySort) {
                $this->applySort($resource);
            }
        });
    }

    /**
     * Resolve the items and wrap them in a paginator, even if the table is not paginated.
     * This is useful for when you want to use the same methods and properties on the
     * paginator, regardless of whether the table is paginated or not.
     */
    protected function resolvePaginator(): AbstractPaginator|AbstractCursorPaginator
    {
        $builder = $this->getResourceWithRequestApplied();

        if (($paginationType = $this->table->getPaginationType()) instanceof PaginationType) {
            if ($paginationType === PaginationType::Cursor) {
                return $builder->cursorPaginate(
                    perPage: $this->tableRequest->perPage(),
                    cursor: $this->tableRequest->cursor(),
                    cursorName: $this->tableRequest->cursorName(),
                );
            }

            return $builder->{$paginationType->getBuilderMethod()}(
                perPage: $this->tableRequest->perPage(),
                pageName: $this->tableRequest->pageName(),
                page: $this->tableRequest->page(),
            );
        }

        $results = $builder->get();

        return new LengthAwarePaginator(
            $results,
            $results->count(),
            $results->count() ?: 1,
        );
    }

    /**
     * Transform the model into an array of attributes that are visible in the table.
     */
    protected function transformModel(Model $model): array
    {
        $columns = collect($this->table->buildColumns());

        $columnImages = $columns
            ->filter(static fn (Column $column): bool => $column->hasImage())
            ->mapWithKeys(static fn (Column $column): array => [$column->getAttribute() => $column->resolveImage($model)])
            ->filter();

        $columnUrls = $columns
            ->filter(static fn (Column $column): bool => $column->hasUrl())
            ->mapWithKeys(static fn (Column $column): array => [$column->getAttribute() => $column->resolveUrl($model)])
            ->filter();

        $hasActions                         = $this->table->hasActions();
        $hasBulkActions                     = $this->table->hasBulkActions();
        $hasExportsThatLimitsToSelectedRows = $this->table->hasExportsThatLimitsToSelectedRows();

        $data = $columns
            ->mapWithKeys(function (Column $column) use ($model): array {
                $attribute = $column->getAttribute();

                if ($column instanceof ActionColumn) {
                    $actionUrls = collect($this->table->actions())
                        ->map(function (Action $action) use ($model): string|array|null {
                            $isHidden   = $action->isHidden($model);
                            $isDisabled = $action->isDisabled($model);

                            if (! $isHidden && ! $isDisabled) {
                                // For backwards compatibility, we return the URL as a string as previous
                                // versions of the package did not support returning an array.
                                return $action->resolveUrl($model);
                            }

                            $url = $action->resolveUrl($model);

                            return array_merge(
                                is_array($url) ? $url : ['url' => $url],
                                ['disabled' => $isDisabled, 'hidden' => $isHidden]
                            );
                        });

                    return [$attribute => $actionUrls];
                }

                return [$attribute => $column->mapForTable($column->getDataFromItem($model), $this->table, $model)];
            })
            ->when(
                $hasActions || $hasExportsThatLimitsToSelectedRows,
                fn (Collection $attributes) => $attributes->prepend($this->table->getPrimaryKey($model), '_primary_key')
            )
            ->when(
                $hasBulkActions || $hasExportsThatLimitsToSelectedRows,
                fn (Collection $attributes) => $attributes->prepend($this->table->isSelectable($model), '_is_selectable')
            )
            ->when(
                $columnUrls->isNotEmpty(),
                fn (Collection $attributes) => $attributes->prepend($columnUrls, '_column_urls')
            )
            ->when(
                $columnImages->isNotEmpty(),
                fn (Collection $attributes) => $attributes->prepend($columnImages, '_column_images')
            );

        $transformed = $this->table->transformModel($model, $data->all());

        if (! blank($dataAttributes = $this->table->dataAttributesForModel($model, $transformed))) {
            $transformed['_data_attributes'] = Html::formatDataAttributes($dataAttributes);
        }

        if (! blank($url = Url::resolve($model, $this->table->rowUrl(...)))) {
            $transformed['_row_url'] = $url;
        }

        return $transformed;
    }

    /**
     * Get the paginator with all the data, preserving the query string, and transform
     * the models so that only the columns that are visible are returned.
     */
    public function get(): AbstractPaginator|AbstractCursorPaginator
    {
        return $this->resolvePaginator()
            ->withQueryString()
            ->through(fn (Model $model): array => $this->transformModel($model));
    }

    /**
     * Returns the connection name of the given Model.
     */
    public static function getModelConnectionName(Model $model): string
    {
        return $model->getConnectionName() ?? app(ConnectionResolverInterface::class)->getDefaultConnection();
    }

    /**
     * Get the 'LIKE' operator for the given Model.
     */
    public static function getWhereLikeOperator(Builder $query): string
    {
        /** @var Connection $connection */
        $connection = $query->getConnection();

        return $connection->getDriverName() === 'pgsql' ? 'ILIKE' : 'LIKE';
    }

    /**
     * Determine if the relation is related through another DB connection.
     */
    public static function isRelatedThroughAnotherConnection(Model $model, string $relation): bool
    {
        $baseModelConnectionName = static::getModelConnectionName($model);

        foreach (explode('.', $relation) as $relationshipName) {
            try {
                /** @var Relation $relation */
                $relation = $model->{$relationshipName}();

                $model = $relation->getQuery()->getModel();
            } catch (Throwable) {
                throw UnresolveabeRelationException::new();
            }

            if (static::getModelConnectionName($model) !== $baseModelConnectionName) {
                return true;
            }
        }

        return false;
    }
}
