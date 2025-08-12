<?php

declare(strict_types=1);

namespace Modules\Table;

trait BelongsToTable
{
    /**
     * The Table instance.
     */
    protected Table $table;

    /**
     * Get the Table instance.
     */
    public function getTable(): Table
    {
        return $this->table;
    }

    /**
     * Set the Table instance.
     */
    public function setTable(Table $table): static
    {
        $this->table = $table;
        $this->onTableSet();

        return $this;
    }

    /**
     * Hook to run when the Table instance is set.
     */
    protected function onTableSet(): void {}
}
