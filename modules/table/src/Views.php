<?php

declare(strict_types=1);

namespace Modules\Table;

use Closure;
use Illuminate\Contracts\Database\Eloquent\Builder;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Traits\Conditionable;
use Illuminate\Support\Traits\Tappable;

class Views implements Arrayable
{
    use BelongsToTable;
    use Conditionable;
    use GeneratesSignedTableUrls;
    use Tappable;

    /**
     * The default attributes resolver for all Views instances.
     */
    protected static ?Closure $defaultAttributes = null;

    /**
     * The default setting for scoping Views by user for all instances.
     */
    protected static ?bool $defaultScopeUser = null;

    /**
     * The default setting for scoping Views by table name for all instances.
     */
    protected static ?bool $defaultScopeTableName = null;

    /**
     * The default setting for scoping Views by stateful resources for all instances.
     */
    protected static ?bool $defaultScopeStatefulResources = null;

    /**
     * The default model class to use when none is provided.
     *
     * @var class-string<TableView>|null
     */
    protected static ?string $defaultModelClass = null;

    /**
     * The default user resolver closure for all instances.
     */
    protected static ?Closure $defaultUserResolver = null;

    /**
     * Create a new Views instance.
     */
    public function __construct(
        protected Closure|array|null $attributes = null,
        protected ?bool $scopeUser = null,
        protected ?bool $scopeTableName = null,
        protected ?bool $scopeStatefulResources = null,
        protected ?string $modelClass = null,
        protected ?Closure $userResolver = null,
    ) {
        if (is_array($attributes)) {
            $attributes = fn (): array => $attributes;
        }

        Helpers::ensureClassIsModelClass($modelClass);
    }

    /**
     * Create a new Views instance.
     */
    public static function make(
        Closure|callable|array|null $attributes = null,
        ?bool $scopeUser = null,
        ?bool $scopeTableName = null,
        ?bool $scopeStatefulResources = null,
        ?string $modelClass = null,
        Closure|callable|null $userResolver = null,
    ): self {
        if (is_array($attributes)) {
            $attributes = fn (): array => $attributes;
        }

        return new self(
            attributes: Helpers::asClosure($attributes),
            scopeUser: $scopeUser,
            scopeTableName: $scopeTableName,
            scopeStatefulResources: $scopeStatefulResources,
            modelClass: Helpers::ensureClassIsModelClass($modelClass),
            userResolver: Helpers::asClosure($userResolver),
        );
    }

    /**
     * Set the Eloquent model class to be used by this instance.
     */
    public function modelClass(string $modelClass): self
    {
        $this->modelClass = Helpers::ensureClassIsModelClass($modelClass);

        return $this;
    }

    /**
     * Set the default Eloquent model class for all Views instances.
     */
    public static function defaultModelClass(string $modelClass): void
    {
        static::$defaultModelClass = Helpers::ensureClassIsModelClass($modelClass);
    }

    /**
     * Get the Eloquent model class for this instance.
     *
     * @return class-string<TableView>
     */
    public function getModelClass(): string
    {
        return $this->modelClass ?? static::$defaultModelClass ?? TableView::class;
    }

    /**
     * Begin a new query for the configured model class.
     *
     * @return \Illuminate\Database\Eloquent\Builder<TableView>
     */
    public function query(): Builder
    {
        $modelClass = $this->getModelClass();

        return $modelClass::query();
    }

    /**
     * Set the user resolver closure for this instance.
     */
    public function userResolver(Closure|callable $userResolver): self
    {
        $this->userResolver = Helpers::asClosure($userResolver);

        return $this;
    }

    /**
     * Set the default user resolver for all Views instances.
     */
    public static function defaultUserResolver(Closure|callable $userResolver): void
    {
        static::$defaultUserResolver = Helpers::asClosure($userResolver);
    }

    /**
     * Resolve and return the current user key (ID or other identifier).
     */
    public function getUserKey(): int|string|null
    {
        $userResolver = $this->userResolver
            ?? static::$defaultUserResolver
            ?? fn (): mixed => Auth::id();

        return App::call($userResolver);
    }

    /**
     * Set the additional attributes resolver for this instance.
     */
    public function attributes(Closure|callable|array $attributes): self
    {
        if (is_array($attributes)) {
            $attributes = fn (): array => $attributes;
        }

        $this->attributes = Helpers::asClosure($attributes);

        return $this;
    }

    /**
     * Set the default attributes resolver for all Views instances.
     */
    public static function defaultAttributes(Closure|callable|array $attributes): void
    {
        if (is_array($attributes)) {
            $attributes = fn (): array => $attributes;
        }

        static::$defaultAttributes = Helpers::asClosure($attributes);
    }

    /**
     * Resolve and return the array of additional attributes for the query.
     */
    public function getAttributes(): array
    {
        $resolver = $this->attributes
            ?? static::$defaultAttributes
            ?? fn (): array => [];

        return App::call($resolver);
    }

    /**
     * Enable or disable scoping by user for this instance.
     */
    public function scopeUser(bool $scopeUser = true): self
    {
        $this->scopeUser = $scopeUser;

        return $this;
    }

    /**
     * Set the default user-scoping behavior for all Views instances.
     */
    public static function defaultScopeUser(bool $scopeUser = true): void
    {
        static::$defaultScopeUser = $scopeUser;
    }

    /**
     * Determine if this instance should scope queries by user.
     */
    public function shouldScopeUser(): bool
    {
        return $this->scopeUser ?? static::$defaultScopeUser ?? true;
    }

    /**
     * Enable or disable scoping by table name for this instance.
     */
    public function scopeTableName(bool $scopeTableName = true): self
    {
        $this->scopeTableName = $scopeTableName;

        return $this;
    }

    /**
     * Set the default table-name scoping behavior for all Views instances.
     */
    public static function defaultScopeTableName(bool $scopeTableName = true): void
    {
        static::$defaultScopeTableName = $scopeTableName;
    }

    /**
     * Determine if this instance should scope queries by table name.
     */
    public function shouldScopeTableName(): bool
    {
        return $this->scopeTableName ?? static::$defaultScopeTableName ?? false;
    }

    /**
     * Enable or disable scoping by stateful resources for this instance.
     */
    public function scopeStatefulResources(bool $scopeStatefulResources = true): self
    {
        $this->scopeStatefulResources = $scopeStatefulResources;

        return $this;
    }

    /**
     * Set the default stateful-resources scoping behavior for all Views instances.
     */
    public static function defaultScopeStatefulResources(bool $scopeStatefulResources = true): void
    {
        static::$defaultScopeStatefulResources = $scopeStatefulResources;
    }

    /**
     * Determine if this instance should scope queries by stateful resources.
     */
    public function shouldScopeStatefulResources(): bool
    {
        return $this->scopeStatefulResources ?? static::$defaultScopeStatefulResources ?? false;
    }

    /**
     * Build the base query with all applicable scopes and filters applied.
     *
     * @return \Illuminate\Database\Eloquent\Builder<TableView>
     */
    protected function scopedQuery(): Builder
    {
        $table      = $this->getTable();
        $attributes = $this->getAttributes();

        return $this->query()
            ->when($attributes !== [], fn (Builder $query) => $query->where($attributes))
            ->when($this->shouldScopeUser(), fn (Builder $query) => $query->user($this->getUserKey()))
            ->when($this->shouldScopeTableName(), fn (Builder $query) => $query->tableName($table->getName()))
            ->when($this->shouldScopeStatefulResources(), fn (Builder $query) => $query->statePayload($table->getSerializedConstructorParamsState()))
            ->table($table);
    }

    /**
     * Store or update a saved view record for the given table and title.
     */
    public function store(string $tableName, string $viewTitle, array $requestQueryParams): Model
    {
        $table = $this->getTable();

        // Simulate a request with the given query parameters to generate the view's request payload.
        $params = TableRequest::for(
            $table, Request::create('/', parameters: $requestQueryParams)
        )->getQueryParamsForView();

        return $this->query()->updateOrCreate([
            ...$this->getAttributes(),
            'user_id'       => $this->getUserKey(),
            'table_class'   => $table::class,
            'table_name'    => $tableName,
            'title'         => $viewTitle,
            'state_payload' => $table->getSerializedConstructorParamsState(),
        ], [
            'request_payload' => $params,
        ]);
    }

    /**
     * Delete a saved view record by its primary key, applying all scopes.
     */
    public function delete(int|string $key): void
    {
        $this->scopedQuery()->whereKey($key)->delete();
    }

    /**
     * Generate a signed URL for storing a new view.
     */
    public function getStoreUrl(): string
    {
        return $this->generateSignedTableUrl($this->getTable(), 'inertia-tables.view.store');
    }

    /**
     * Generate a signed URL for deleting an existing view.
     */
    public function getDeleteUrl(int|string $key): string
    {
        return $this->generateSignedTableUrl(
            $this->getTable(),
            'inertia-tables.view.destroy',
            ['key' => $key]
        );
    }

    /**
     * Retrieve the array of saved views data, including ID, title, state, and delete URL.
     */
    protected function getData(): array
    {
        if (Helpers::isPartialReload()) {
            return [];
        }

        return $this->scopedQuery()
            ->orderByTitle()
            ->get()
            ->map(fn (Model $view): array => [
                'id'        => $key = $view->getKey(),
                'title'     => $view->title,
                'state'     => TableRequest::forQueryParams($this->getTable(), $view->request_payload)->toArray(),
                'deleteUrl' => $this->getDeleteUrl($key),
            ])
            ->all();
    }

    /**
     * Convert the Views instance to an array representation.
     */
    public function toArray(): array
    {
        return [
            'data'     => $this->getData(),
            'query'    => $this->getTable()->getTableRequest()->getQueryParamsForView(),
            'storeUrl' => $this->getStoreUrl(),
        ];
    }
}
