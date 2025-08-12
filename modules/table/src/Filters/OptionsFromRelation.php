<?php

declare(strict_types=1);

namespace Modules\Table\Filters;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOneOrMany;
use Illuminate\Database\Eloquent\Relations\Relation;

class OptionsFromRelation
{
    /**
     * The main Model instance.
     */
    protected Model $model;

    /**
     * Cached pluck column.
     */
    protected ?string $pluckColumn = null;

    public function __construct(
        public readonly string $attribute,
        public readonly ?string $relation,
        public readonly string $value = 'name',
    ) {}

    /**
     * Set the main Model instance.
     */
    public function setModel(Model $model): self
    {
        $this->model = $model;

        return $this;
    }

    protected function getRelationName(): string
    {
        return $this->relation ?? $this->attribute;
    }

    /**
     * Generate the filter attribute.
     */
    public function generateFilterAttribute(): string
    {
        return sprintf('%s.%s', $this->getRelationName(), $this->pluckColumn());
    }

    /**
     * Resolves the relation instance.
     */
    protected function getRelation(): Relation
    {
        return $this->model->{$this->getRelationName()}();
    }

    /**
     * Get the column to pluck from the relation.
     */
    protected function pluckColumn(): string
    {
        if (! is_null($this->pluckColumn)) {
            return $this->pluckColumn;
        }

        $relation = $this->getRelation();

        return $this->pluckColumn = match (true) {
            $relation instanceof BelongsTo => $relation->getOwnerKeyName(),
            $relation instanceof HasOneOrMany => $relation->getLocalKeyName(),
            $relation instanceof BelongsToMany => $relation->getRelatedKeyName(),
            default => throw UnsupportedRelationTypeException::new(),
        };
    }

    /**
     * Pluck the options from the relation.
     */
    public function pluck(): array
    {
        $relation = $this->getRelation();

        assert($relation instanceof BelongsTo || $relation instanceof HasOneOrMany || $relation instanceof BelongsToMany);

        return $relation
            ->getModel()
            ->orderBy($this->value)
            ->pluck($this->value, $this->pluckColumn())
            ->toArray();
    }
}
