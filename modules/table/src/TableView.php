<?php

declare(strict_types=1);

namespace Modules\Table;

use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $table_class
 * @property string $table_name
 * @property string $title
 * @property string $state_payload
 * @property array $request_payload
 */
class TableView extends Model
{
    protected static $unguarded = true;

    protected $casts = [
        'table_class' => 'string',
        'table_name' => 'string',
        'title' => 'string',
        'state_payload' => 'string',
        'request_payload' => 'json',
    ];

    /**
     * Scope to order views by title.
     */
    public function scopeOrderByTitle(Builder $query): void
    {
        $query->orderBy($query->qualifyColumn('title'));
    }

    /**
     * Scope to filter views by user.
     */
    public function scopeUser(Builder $query, int|string|null $id): void
    {
        is_null($id)
            ? $query->whereNull($query->qualifyColumn('user_id'))
            : $query->where($query->qualifyColumn('user_id'), $id);
    }

    /**
     * Scope to filter views by table class.
     */
    public function scopeTable(Builder $query, Table $table): void
    {
        $query->where($query->qualifyColumn('table_class'), $table::class);
    }

    /**
     * Scope to filter views by table name.
     */
    public function scopeTableName(Builder $query, string $tableName): void
    {
        $query->where($query->qualifyColumn('table_name'), $tableName);
    }

    /**
     * Scope to filter views by state payload.
     */
    public function scopeStatePayload(Builder $query, string $statePayload): void
    {
        $query->where($query->qualifyColumn('state_payload'), $statePayload);
    }
}
