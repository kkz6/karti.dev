<?php

declare(strict_types=1);

namespace Modules\Table;

use Illuminate\Contracts\Database\Query\Builder;
use Illuminate\Database\Connection;
use InvalidArgumentException;

/**
 * @see https://github.com/laravel/framework/pull/52483
 * @see https://github.com/laravel/framework/pull/52535
 */
class SortUsingPriority
{
    public function __construct(
        protected string $column,
        protected array $priority,
    ) {
        if ($priority === []) {
            throw new InvalidArgumentException('Priority array cannot be empty');
        }
    }

    /**
     * Apply the sorting to the query.
     */
    public function __invoke(Builder $builder, SortDirection $direction): void
    {
        /** @var Connection $connection */
        $connection = $builder->getConnection();

        match ($connection->getDriverName()) {
            'mysql' => $this->handleMysqlConnection($builder, $direction),
            'pgsql' => $this->handlePostgresConnection($builder, $direction),
            'sqlite' => $this->handleSqliteConnection($builder, $direction),
            default => throw new InvalidArgumentException('Unsupported database driver'),
        };
    }

    /**
     * Handle the MySQL connection.
     *
     * select * from `users` order by FIELD(status, 'active','blocked','inactive','pending','deleted') asc
     */
    protected function handleMysqlConnection(Builder $builder, SortDirection $direction): void
    {
        $cases = implode(',', array_fill(0, count($this->priority), '?'));

        $builder->orderByRaw(sprintf('FIELD(%s, %s) %s', $this->column, $cases, $direction->value), $this->priority);
    }

    /**
     * Handle the Postgres connection.
     *
     * select * from "users" order by array_position(ARRAY['active','blocked','inactive','pending','deleted'], status) asc
     */
    protected function handlePostgresConnection(Builder $builder, SortDirection $direction): void
    {
        $cases = implode(',', array_fill(0, count($this->priority), '?'));

        $builder->orderByRaw(sprintf('array_position(ARRAY[%s], %s) %s', $cases, $this->column, $direction->value), $this->priority);
    }

    /**
     * Handle the SQLite connection.
     *
     * select * from "users" order by case when status = 'active' then 0 when status = 'blocked' then 1 when status = 'inactive' then 2 when status = 'pending' then 3 when status = 'deleted' then 4 else 5 end asc
     */
    protected function handleSqliteConnection(Builder $builder, SortDirection $direction): void
    {
        $count = count($this->priority);

        $cases = array_map(
            fn ($index): string => sprintf('when %s = ? then %s', $this->column, $index),
            range(0, $count - 1)
        );

        $cases = implode(' ', $cases);

        $builder->orderByRaw(sprintf('case %s else %d end %s', $cases, $count, $direction->value), $this->priority);
    }
}
