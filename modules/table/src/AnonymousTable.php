<?php

declare(strict_types=1);

namespace Modules\Table;

use Closure;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class AnonymousTable extends Table
{
    public function __construct(
        protected readonly Builder $anonymousResource,
        protected readonly array $columns,
        protected readonly array $filters,
        array $search,
        protected readonly ?Closure $transformModelUsing = null,
        protected readonly ?Closure $withQueryBuilder = null,
        protected readonly array $actions = [],
        protected readonly ?EmptyState $emptyState = null,
    ) {
        $this->search = $search;
    }

    /**
     * {@inheritDoc}
     */
    public function resource(): Builder|string
    {
        return $this->anonymousResource;
    }

    /**
     * {@inheritDoc}
     */
    public function columns(): array
    {
        return $this->columns;
    }

    /**
     * {@inheritDoc}
     */
    public function filters(): array
    {
        return $this->filters;
    }

    /**
     * {@inheritDoc}
     */
    public function actions(): array
    {
        return $this->actions;
    }

    /**
     * {@inheritDoc}
     */
    public function emptyState(): ?EmptyState
    {
        return $this->emptyState;
    }

    /**
     * {@inheritDoc}
     */
    public function transformModel(Model $model, array $data): array
    {
        return $this->transformModelUsing instanceof Closure
            ? call_user_func($this->transformModelUsing, $model, $data)
            : parent::transformModel($model, $data);
    }

    /**
     * {@inheritDoc}
     */
    public function withQueryBuilder(QueryBuilder $queryBuilder)
    {
        if ($this->withQueryBuilder instanceof Closure) {
            return call_user_func($this->withQueryBuilder, $queryBuilder) ?? $queryBuilder;
        }

        return $queryBuilder;
    }
}
