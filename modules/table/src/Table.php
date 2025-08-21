<?php

declare(strict_types=1);

namespace Modules\Table;

use Closure;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Pagination\AbstractCursorPaginator;
use Illuminate\Pagination\AbstractPaginator;
use Illuminate\Pagination\CursorPaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Support\Traits\Conditionable;
use Illuminate\Support\Traits\Tappable;
use Maatwebsite\Excel\Excel;
use Modules\Table\Columns\Column;
use Modules\Table\Enums\PaginationType;
use Modules\Table\Enums\ScrollPosition;
use Modules\Table\Enums\TableComponent;
use Modules\Table\Filters\Filter;
use Modules\Table\Traits\EncryptsAndDecryptsState;
use RuntimeException;
use TypeError;

abstract class Table implements Arrayable
{
    use Conditionable;
    use EncryptsAndDecryptsState;
    use Tappable;

    /**
     * The Table name.
     */
    protected string $name = 'default';

    /**
     * Boolean indicating if the Table should paginate.
     */
    protected bool $pagination = true;

    /**
     * The pagination type for the Table.
     */
    protected PaginationType $paginationType = PaginationType::Full;

    /**
     * The debounce time for the Table.
     */
    protected ?int $debounceTime = null;

    /**
     * The default debounce time for all Tables.
     */
    protected static ?int $defaultDebounceTime = null;

    /**
     * The per page options for the Table.
     */
    protected ?array $perPageOptions = null;

    /**
     * The default per page options for all Tables.
     */
    protected static ?array $defaultPerPageOptions = null;

    /**
     * The default sort column for the Table.
     */
    protected ?string $defaultSort = null;

    /**
     * The attributes that are searchable.
     */
    protected array|string $search = [];

    /**
     * The Eloquent Builder or Model for the Table.
     */
    protected ?string $resource = null;

    /**
     * The Request instance.
     */
    protected ?Request $request = null;

    /**
     * The Request instance that is serialized.
     */
    protected ?array $sleepingRequest = null;

    /**
     * The Inertia Page properties that should be reloaded when the Table is reloaded.
     */
    protected array $reloadProps = [];

    /**
     * Always reload all Inertia Page properties when the Table is reloaded.
     */
    protected static bool $alwaysReloadAllProps = false;

    /**
     * The resolved Columns.
     */
    protected ?array $cachedColumns = null;

    /**
     * The resolved Filters.
     */
    protected ?array $cachedFilters = null;

    /**
     * The desired scroll position after a page change.
     */
    protected ?ScrollPosition $scrollPositionAfterPageChange = null;

    /**
     * The default scroll position after a page change.
     */
    protected static ?ScrollPosition $defaultScrollPositionAfterPageChange = null;

    /**
     * The Table component to autofocus on page load.
     */
    protected ?TableComponent $autofocus = null;

    /**
     * The default Table component to autofocus on page load.
     */
    protected static ?TableComponent $defaultAutofocus = null;

    /**
     * Indicates if the Table has a sticky header.
     */
    protected ?bool $stickyHeader = null;

    /**
     * Indicates if the Table has a sticky header by default.
     */
    protected static ?bool $defaultStickyHeader = null;

    /**
     * The resolver for the default views for the Table.
     */
    protected static ?Closure $defaultViewsResolver = null;

    /**
     * Get the Table name.
     */
    public function getName(): string
    {
        return $this->name;
    }

    /**
     * Set the Table name.
     */
    public function as(string $name): self
    {
        $this->name = Str::slug($name);

        return $this;
    }

    /**
     * Set the Request instance.
     */
    public function setRequest(Request $request): self
    {
        $this->request = $request;

        return $this;
    }

    /**
     * Return a new TableRequest instance for this Table.
     */
    public function getTableRequest(): TableRequest
    {
        return TableRequest::for($this, $this->request ?? request());
    }

    /**
     * Get the default sort column for the Table.
     */
    public function getDefaultSort(): ?string
    {
        return $this->defaultSort;
    }

    /**
     * Set the default sort column for the Table.
     */
    public function defaultSort(?string $defaultSort = null): self
    {
        $this->defaultSort = $defaultSort;

        return $this;
    }

    /**
     * Return a boolean indicating if the Table should paginate.
     */
    public function shouldPaginate(): bool
    {
        return $this->pagination;
    }

    /**
     * Enable cursor pagination for this Table.
     */
    public function cursorPagination(): self
    {
        $this->pagination     = true;
        $this->paginationType = PaginationType::Cursor;

        return $this;
    }

    /**
     * Enable simple pagination for this Table.
     */
    public function simplePagination(): self
    {
        $this->pagination     = true;
        $this->paginationType = PaginationType::Simple;

        return $this;
    }

    /**
     * Get the pagination type for the Table.
     */
    public function getPaginationType(): ?PaginationType
    {
        return $this->shouldPaginate() ? $this->paginationType : null;
    }

    /**
     * Disable pagination for this Table.
     */
    public function withoutPagination(): self
    {
        $this->pagination = false;

        return $this;
    }

    /**
     * Set the per page options for this Table.
     */
    public function perPageOptions(?array $perPageOptions = null): self
    {
        $this->perPageOptions = $perPageOptions;

        return $this;
    }

    /**
     * Set the default per page options for all Tables.
     */
    public static function defaultPerPageOptions(?array $perPageOptions = null): void
    {
        static::$defaultPerPageOptions = $perPageOptions;
    }

    /**
     * Return the per page options.
     */
    public function getPerPageOptions(): array
    {
        return tap(
            $this->perPageOptions ?? static::$defaultPerPageOptions ?? [15, 30, 50, 100],
            function (array $options): void {
                foreach ($options as $option) {
                    if (! is_int($option)) {
                        throw new TypeError('The per page options must be an array of integers.');
                    }
                }
            }
        );
    }

    /**
     * Get the first per page option as the default.
     */
    public function getDefaultPerPage(): int
    {
        return Arr::first($this->getPerPageOptions());
    }

    /**
     * Set the debounce time for the Table.
     */
    public function debounceTime(?int $debounceTime = null): self
    {
        $this->debounceTime = $debounceTime;

        return $this;
    }

    /**
     * Set the default debounce time for all Tables.
     */
    public static function defaultDebounceTime(?int $debounceTime = null): void
    {
        static::$defaultDebounceTime = $debounceTime;
    }

    /**
     * Get the debounce time for the Table.
     */
    public function getDebounceTime(): int
    {
        return $this->debounceTime ?? static::$defaultDebounceTime ?? 300;
    }

    /**
     * Set the scroll position after a page change.
     */
    public function scrollPositionAfterPageChange(?ScrollPosition $scrollPositionAfterPageChange = null): self
    {
        $this->scrollPositionAfterPageChange = $scrollPositionAfterPageChange;

        return $this;
    }

    /**
     * Set the default scroll position after a page change.
     */
    public static function defaultScrollPositionAfterPageChange(?ScrollPosition $scrollPositionAfterPageChange = null): void
    {
        static::$defaultScrollPositionAfterPageChange = $scrollPositionAfterPageChange;
    }

    /**
     * Get the scroll position after a page change.
     */
    public function getScrollPositionAfterPageChange(): ScrollPosition
    {
        return $this->scrollPositionAfterPageChange ?? static::$defaultScrollPositionAfterPageChange ?? ScrollPosition::TopOfPage;
    }

    /**
     * Set the Table component to autofocus on page load.
     */
    public function autofocus(?TableComponent $autofocus = null): self
    {
        $this->autofocus = $autofocus;

        return $this;
    }

    /**
     * Set the default Table component to autofocus on page load.
     */
    public static function defaultAutofocus(?TableComponent $autofocus = null): void
    {
        static::$defaultAutofocus = $autofocus;
    }

    /**
     * Get the Table component to autofocus on page load.
     */
    public function getAutofocus(): TableComponent
    {
        return $this->autofocus ?? static::$defaultAutofocus ?? TableComponent::Search;
    }

    /**
     * Make the Table header sticky.
     */
    public function stickyHeader(?bool $stickyHeader = true): self
    {
        $this->stickyHeader = $stickyHeader;

        return $this;
    }

    /**
     * Set the default sticky header for all Tables.
     */
    public static function defaultStickyHeader(?bool $stickyHeader = true): void
    {
        static::$defaultStickyHeader = $stickyHeader;
    }

    /**
     * Get the sticky header for the Table.
     */
    public function getStickyHeader(): bool
    {
        return $this->stickyHeader ?? static::$defaultStickyHeader ?? false;
    }

    /**
     * Set the default views resolver for the Table.
     */
    public static function defaultViewsResolver(Closure|callable|null $resolver): void
    {
        static::$defaultViewsResolver = Helpers::asClosure($resolver);
    }

    /**
     * Create an anonymous Table instance.
     */
    public static function build(
        Builder|string $resource,
        array $columns = [],
        array $filters = [],
        string|array $search = [],
        string $name = 'default',
        bool $pagination = true,
        ?int $debounceTime = null,
        ?array $perPageOptions = null,
        ?string $defaultSort = null,
        Closure|callable|null $transformModelUsing = null,
        Closure|callable|null $withQueryBuilder = null,
        array $actions = [],
        ?EmptyState $emptyState = null,
        ?bool $stickyHeader = null,
    ): self {
        $table = new AnonymousTable(
            is_string($resource) ? $resource::query() : $resource,
            $columns,
            $filters,
            Arr::wrap($search),
            Helpers::asClosure($transformModelUsing),
            Helpers::asClosure($withQueryBuilder),
            $actions,
            $emptyState
        );

        return $table
            ->unless($pagination, fn (AnonymousTable $table): Table => $table->withoutPagination())
            ->defaultSort($defaultSort)
            ->as($name)
            ->debounceTime($debounceTime)
            ->perPageOptions($perPageOptions)
            ->stickyHeader($stickyHeader);
    }

    /**
     * Resolve the resource for the Table.
     */
    public function resource(): Builder|string
    {
        if (blank($this->resource)) {
            throw new RuntimeException('The Table resource is not set.');
        }

        return $this->resource::query();
    }

    /**
     * Resolve the Eloquent Builder for the Model.
     */
    public function resourceBuilder(): Builder
    {
        $resource = $this->resource();

        if (is_string($resource)) {
            /** @var class-string<Model> $resource */
            $resource = $resource::query();
        }

        return $resource;
    }

    /**
     * All available Columns.
     *
     * @return array<int, Column>
     */
    public function columns(): array
    {
        return [];
    }

    /**
     * All available Filters.
     *
     * @return array<int, Filter>
     */
    public function filters(): array
    {
        return [];
    }

    /**
     * A proxy to columns() that caches the result.
     */
    public function buildColumns(): array
    {
        return $this->cachedColumns ??= $this->columns();
    }

    /**
     * A proxy to filters() that caches the result.
     */
    public function buildFilters(): array
    {
        return $this->cachedFilters ??= collect($this->filters())
            ->values()
            ->each(fn (Filter $filter): Filter => $filter->setTable($this))
            ->all();
    }

    /**
     * All available Actions.
     *
     * @return array<int, Action>
     */
    public function actions(): array
    {
        return [];
    }

    /**
     * All available Exports.
     *
     * @return array<int, Export>
     */
    public function exports(): array
    {
        return [];
    }

    /**
     * Get the Column by attribute.
     */
    public function getColumnByAttribute(string $attribute): ?Column
    {
        return collect($this->buildColumns())
            ->first(static fn (Column $column): bool => $column->getAttribute() === $attribute);
    }

    /**
     * Get the primary key for the given Eloquent Model.
     */
    public function getPrimaryKey(Model $model): mixed
    {
        return $model->getKey();
    }

    /**
     * Add a where clause on the primary key to the query.
     */
    public function scopePrimaryKey(Builder $builder, array $keys): void
    {
        $keys = array_values($keys);

        if ($keys === [] || $keys === ['*']) {
            return;
        }

        $builder->whereKey($keys);
    }

    /**
     * Custom transformation of the Model data.
     */
    public function dataAttributesForModel(Model $model, array $data): ?array
    {
        return null;
    }

    /**
     * Return an array of searchable attributes.
     *
     * @return array<int, string>
     */
    public function search(): array
    {
        return collect($this->buildColumns())
            ->filter(fn (Column $column): bool => $column->isSearchable())
            ->map(fn (Column $column): string => $column->getAttribute())
            ->merge(Arr::wrap($this->search))
            ->unique()
            ->values()
            ->all();
    }

    /**
     * Return a boolean indicating if the Table has any Actions.
     */
    public function hasActions(): bool
    {
        return $this->actions() !== [];
    }

    /**
     * Return a boolean indicating if the Table has any Bulk Actions.
     */
    public function hasBulkActions(): bool
    {
        return collect($this->actions())->contains(fn (Action $action): bool => $action->isBulkActionable());
    }

    /**
     * Return a boolean indicating if the Table has any Exports that can be limited to selected rows.
     */
    public function hasExportsThatLimitsToSelectedRows(): bool
    {
        return collect($this->exports())->contains(fn (Export $export): bool => $export->shouldLimitToSelectedRows());
    }

    /**
     * Get the Action by ID.
     */
    public function getActionById(int $id): ?Action
    {
        return tap(
            array_values($this->actions())[$id] ?? null,
            fn (?Action $action): ?\Modules\Table\Action => $action?->setIndex($id)->setTable($this)
        );
    }

    /**
     * Collect all Actions and set the ID and Table instance on each.
     */
    protected function buildActions()
    {
        return collect($this->actions())
            ->values()
            ->each(fn (Action $action, $id): Action => $action->setIndex($id)->setTable($this))
            ->toArray();
    }

    /**
     * Get the Export by ID.
     */
    public function getExportById(int $id): ?Export
    {
        return tap(
            array_values($this->exports())[$id] ?? null,
            fn (?Export $export): ?\Modules\Table\Export => $export?->setIndex($id)->setTable($this)
        );
    }

    /**
     * Collect all Exports and set the ID and Table instance on each.
     */
    protected function buildExports(): array
    {
        return collect($this->exports())
            ->whenNotEmpty(function (): void {
                // Assert that the 'maatwebsite/excel' package is installed.
                if (! class_exists(Excel::class)) {
                    throw new RuntimeException(
                        "To use the 'export' feature, please install the 'maatwebsite/excel' package."
                    );
                }
            })
            ->values()
            ->each(fn (Export $export, $id): Export => $export->setIndex($id)->setTable($this))
            ->toArray();
    }

    /**
     * Resolve this Table instance from the container.
     */
    public static function make(): static
    {
        return app(static::class);
    }

    /**
     * Custom transformation of the Model data.
     */
    public function transformModel(Model $model, array $data): array
    {
        return $data;
    }

    /**
     * Resolve the URL for the given model that is navigated to when clicking on a row.
     */
    public function rowUrl(Model $model, Url $url): Url|string|null
    {
        return null;
    }

    /**
     * Return a boolean indicating whether the Model is selectable.
     */
    public function isSelectable(Model $model): bool
    {
        return true;
    }

    /**
     * Create a new QueryBuilder instance for the Table.
     */
    public function queryBuilder(): QueryBuilder
    {
        $queryBuilder = QueryBuilder::from($this);

        return $this->withQueryBuilder($queryBuilder) ?? $queryBuilder;
    }

    /**
     * Return the Eloquent Builder with the Request applied.
     */
    public function queryWithRequestApplied(bool $applySort = true): Builder
    {
        return $this->queryBuilder()->getResourceWithRequestApplied($applySort);
    }

    /**
     * Interact with the QueryBuilder instance.
     */
    public function withQueryBuilder(QueryBuilder $queryBuilder) {}

    /**
     * Set the Inertia Page properties that should be reloaded when the Table is reloaded.
     */
    public function reloadProps(array|string $props): self
    {
        $this->reloadProps = Arr::wrap($props);

        return $this;
    }

    /**
     * Reload all Inertia Page properties when the Table is reloaded.
     */
    public function reloadAllProps(): self
    {
        return $this->reloadProps('*');
    }

    /**
     * Always reload all Inertia Page properties when the Table is reloaded.
     */
    public static function alwaysReloadAllProps(bool $value = true): void
    {
        static::$alwaysReloadAllProps = $value;
    }

    /**
     * Get the Inertia Page properties that should be reloaded when the Table is reloaded.
     */
    public function getReloadProps(): array
    {
        return match (true) {
            $this->reloadProps !== []     => $this->reloadProps,
            static::$alwaysReloadAllProps => ['*'],
            default                       => [],
        };
    }

    /**
     * Get the empty state for the Table.
     */
    public function emptyState(): ?EmptyState
    {
        return null;
    }

    /**
     * Resolve the empty state for the array representation of the Table.
     */
    protected function resolveEmptyState(AbstractPaginator|AbstractCursorPaginator $data, TableRequest $tableRequest): array|bool
    {
        if (! $data->isEmpty()) {
            return false;
        }

        if (! $data->onFirstPage()) {
            return false;
        }

        if (! $tableRequest->inDefaultState()) {
            return false;
        }

        return $this->emptyState()?->toArray() ?? true;
    }

    /**
     * Get the views for the Table.
     */
    public function views(): ?Views
    {
        if (static::$defaultViewsResolver instanceof Closure) {
            return call_user_func(static::$defaultViewsResolver, $this);
        }

        return null;
    }

    public function buildViews(): ?Views
    {
        return $this->views()?->setTable($this);
    }

    /**
     * Get the array representation of the Table.
     */
    public function toArray(): array
    {
        $tableRequest   = $this->getTableRequest();
        $queryBuilder   = $this->queryBuilder();
        $paginator      = $queryBuilder->get();
        $results        = $paginator->toArray();
        $paginationType = $this->getPaginationType();

        // The CursorPaginator does not have a 'first_page_url' attribute.
        if ($paginationType === PaginationType::Cursor) {
            /** @var CursorPaginator $paginator */
            $results['first_page_url'] = $paginator->url(null);
        }

        // A unified way to determine if the current page is the first or last page.
        $results['on_first_page'] = $paginator->onFirstPage();
        $results['on_last_page']  = $paginator->onLastPage();

        return tap([
            'name'                               => $this->name,
            'results'                            => $results,
            'search'                             => $search   = $this->search(),
            'columns'                            => $columns  = collect($this->buildColumns())->toArray(),
            'filters'                            => $filters  = collect($this->buildFilters())->toArray(),
            'actions'                            => $actions  = $this->buildActions(),
            'exports'                            => $exports  = $this->buildExports(),
            'state'                              => $tableRequest->toArray(),
            'pagination'                         => $this->shouldPaginate(),
            'paginationType'                     => $paginationType?->value,
            'perPageOptions'                     => $this->getPerPageOptions(),
            'defaultPerPage'                     => $this->getDefaultPerPage(),
            'defaultSort'                        => $this->getDefaultSort(),
            'debounceTime'                       => $this->getDebounceTime(),
            'reloadProps'                        => $this->getReloadProps(),
            'hasActions'                         => count($actions) > 0,
            'hasBulkActions'                     => collect($actions)->contains(fn (array $action): bool => $action['asBulkAction']),
            'hasExports'                         => $exports !== [],
            'hasExportsThatLimitsToSelectedRows' => collect($exports)->contains(fn (array $export): bool => $export['limitToSelectedRows']),
            'hasFilters'                         => count($filters) > 0,
            'hasSearch'                          => $search !== [] || $queryBuilder->hasCustomSearch(),
            'hasToggleableColumns'               => collect($columns)->contains(fn (array $column): bool => $column['toggleable']),
            'scrollPositionAfterPageChange'      => $this->getScrollPositionAfterPageChange()->value,
            'autofocus'                          => $this->getAutofocus()->value,
            'emptyState'                         => $this->resolveEmptyState($paginator, $tableRequest),
            'stickyHeader'                       => $this->getStickyHeader(),
            'views'                              => $this->buildViews()?->toArray(),
            'inDefaultState'                     => $tableRequest->inDefaultState(),
        ], fn () => $this->flushStateCache());
    }

    /**
     * Prepare the object for serialization.
     */
    public function __sleep(): array
    {
        $this->cachedColumns = null;
        $this->cachedFilters = null;

        if ($this->request instanceof Request) {
            $this->sleepingRequest = [
                'class'         => $this->request::class,
                'query'         => $this->request->query->all(),
                'content'       => $this->request->getContent(),
                'locale'        => $this->request->getLocale(),
                'defaultLocale' => $this->request->getDefaultLocale(),
                'json'          => $this->request->json(),
            ];

            $this->request = null;
        }

        return array_keys(get_object_vars($this));
    }

    /**
     * Restore the object after serialization.
     */
    public function __wakeup(): void
    {
        if ($this->sleepingRequest === null || $this->sleepingRequest === []) {
            return;
        }

        $this->request = new $this->sleepingRequest['class'];
        $this->request->initialize(
            query: $this->sleepingRequest['query'],
            content: $this->sleepingRequest['content']
        );

        $this->request->setRequestLocale($this->sleepingRequest['locale']);
        $this->request->setDefaultRequestLocale($this->sleepingRequest['defaultLocale']);
        $this->request->setJson($this->sleepingRequest['json']);

        $this->sleepingRequest = null;
    }
}
