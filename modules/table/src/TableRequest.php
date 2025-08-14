<?php

declare(strict_types=1);

namespace Modules\Table;

use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Modules\Table\Columns\Column;
use Modules\Table\Filters\Filter;
use Modules\Table\Filters\FilterRequest;

class TableRequest implements Arrayable
{
    /**
     * The query data for the Table.
     */
    protected array $queryData = [];

    public function __construct(
        protected readonly Request $request,
        protected readonly Table $table,
    ) {
        $queryKey = $this->table->getName() === 'default' ? null : $this->table->getName();

        $this->queryData = $this->request->query($queryKey, []);
    }

    /**
     * Create a new TableRequest instance for the given Table.
     */
    public static function for(Table $table, ?Request $request = null): static
    {
        return new static($request ?? request(), $table);
    }

    /**
     * Create a new TableRequest instance for the given Table and query parameters.
     */
    public static function forQueryParams(Table $table, array $queryParams): static
    {
        return static::for($table, Request::create('/', parameters: $queryParams));
    }

    /**
     * Get the value of the given key from the query data.
     */
    protected function query(string $key, mixed $default = null): mixed
    {
        return data_get($this->queryData, $key, $default);
    }

    /**
     * Get the query data that should be used for exports.
     */
    public function getQueryDataForExports(): array
    {
        $data = Arr::only($this->queryData, [
            'filters',
            'search',
            'sort',
        ]);

        $name = $this->table->getName();

        return $name === 'default' ? $data : [$name => $data];
    }

    /**
     * Resolve the state of the columns.
     */
    public function columns(): array
    {
        $state = $this->query('columns', []);

        return collect($this->table->buildColumns())
            ->keyBy(static fn (Column $column): string => $column->getAttribute())
            ->map(static function (Column $column) use ($state): bool {
                if (! $column->isToggleable()) {
                    return true;
                }

                return empty($state)
                    ? $column->isVisible()
                    : in_array($column->getAttribute(), $state);
            })
            ->toArray();
    }

    /**
     * Resolve the state of the sticky columns.
     */
    public function stickyColumns(): array
    {
        $state = $this->query('sticky', []);

        return collect($this->table->buildColumns())
            ->keyBy(static fn (Column $column): string => $column->getAttribute())
            ->filter(static function (Column $column) use ($state): bool {
                if (! $column->isStickable()) {
                    return false;
                }

                return in_array($column->getAttribute(), $state);
            })
            ->keys()
            ->all();
    }

    /**
     * Resolve the state of the filters.
     */
    public function filters(): array
    {
        return collect($this->table->buildFilters())
            ->mapWithKeys(function (Filter $filter): array {
                $attribute = $filter->getAttribute();

                $query = $this->query('filters')[$attribute] ?? null;

                return [$attribute => FilterRequest::make($filter, $query)];
            })
            ->all();
    }

    /**
     * Resolve the current number of items per page.
     */
    public function perPage(): int
    {
        $perPage = (int) $this->query('perPage');

        return in_array($perPage, $this->table->getPerPageOptions())
            ? $perPage
            : $this->table->getDefaultPerPage();
    }

    /**
     * Resolve the current page number.
     */
    public function page(): int
    {
        return max(1, (int) $this->query('page', 1));
    }

    /**
     * Resolve the current cursor.
     */
    public function cursor(): ?string
    {
        $cursor = $this->query('cursor');

        return blank($cursor) ? null : $cursor;
    }

    /**
     * Resolve the current search query.
     */
    public function search(): ?string
    {
        $search = $this->query('search');

        return blank($search) ? null : $search;
    }

    /**
     * Resolve the current sort column.
     */
    public function sort(): ?string
    {
        $sort = $this->query('sort');

        if (blank($sort)) {
            return $this->table->getDefaultSort();
        }

        $column = $this->table->getColumnByAttribute(ltrim((string) $sort, '-'));

        return $column?->isSortable() === true ? $sort : null;
    }

    /**
     * Resolve the current sort direction.
     */
    public function sortDirection(): ?SortDirection
    {
        if (($sort = $this->sort()) === null) {
            return null;
        }

        return Str::startsWith($sort, '-') ? SortDirection::Descending : SortDirection::Ascending;
    }

    /**
     * Get the Column that the Table is currently sorted by.
     */
    public function sortedColumn(): ?Column
    {
        if (($sort = $this->sort()) === null) {
            return null;
        }

        return $this->table->getColumnByAttribute(ltrim($sort, '-'));
    }

    /**
     * Get the keys of the selected rows.
     */
    public function selectedKeys(): array
    {
        return $this->request->collect('keys')->all();
    }

    /**
     * Get the name of the cursor query parameter.
     */
    public function cursorName(): string
    {
        $tableName = $this->table->getName();

        return $tableName === 'default' ? 'cursor' : $tableName.'[cursor]';
    }

    /**
     * Get the name of the page query parameter.
     */
    public function pageName(): string
    {
        $tableName = $this->table->getName();

        return $tableName === 'default' ? 'page' : $tableName.'[page]';
    }

    /**
     * Returns a boolean indicating if the requested state
     * is the default state of the Table.
     */
    public function inDefaultState(): bool
    {
        if ($this->cursor() !== null) {
            return false;
        }

        if ($this->page() !== 1) {
            return false;
        }

        if ($this->search() !== null) {
            return false;
        }

        return collect($this->filters())
            ->first(fn (FilterRequest $filterRequest): bool => $filterRequest->value !== $filterRequest->filter->getDefaultValue()) === null;
    }

    /**
     * Get the array representation of the state of the Table.
     */
    public function toArray(): array
    {
        return [
            'columns' => $this->columns(),
            'filters' => collect($this->filters())->toArray(),
            'perPage' => $this->perPage(),
            'search'  => $this->search(),
            'sort'    => $this->sort(),
            'sticky'  => $this->stickyColumns(),
        ];
    }

    /**
     * Get the query parameters that should be used for views.
     */
    public function getQueryParamsForView(): array
    {
        return collect([
            'columns' => $this->query('columns') ? array_keys(array_filter($this->columns())) : null,
            'cursor'  => $this->cursor(),
            'filters' => collect($this->filters())
                ->filter->enabled
                ->map(fn (FilterRequest $filterRequest): array => [
                    'clause' => $filterRequest->clause->value,
                    'value'  => $filterRequest->value,
                ])
                ->toArray(),
            'perPage' => $this->perPage(),
            'search'  => $this->search(),
            'sort'    => $this->sort(),
            'sticky'  => $this->stickyColumns(),
        ])
            ->reject(fn ($value) => blank($value))
            ->toArray();
    }

    /**
     * Get the Illuminate Request instance.
     */
    public function getIlluminateRequest(): Request
    {
        return $this->request;
    }
}
