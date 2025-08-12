<?php

declare(strict_types=1);

namespace Modules\Table\Http;

use Illuminate\Foundation\Http\FormRequest;
use Modules\Table\AnonymousTable;
use Modules\Table\AnonymousTablesException;
use Modules\Table\InvalidTableClassException;
use Modules\Table\Table;

/** @mixin FormRequest */
trait ResolvesTableInstance
{
    /**
     * Resolve the table instance from the route parameters.
     */
    public function getTable(): Table
    {
        /** @var class-string<Table> $tableClass */
        $tableClass = base64_decode($this->route('table'));

        if ($tableClass === AnonymousTable::class) {
            throw AnonymousTablesException::new();
        }

        if (! class_exists($tableClass)) {
            throw InvalidTableClassException::new($tableClass);
        }

        /** @var Table $table */
        $table = Table::hasConstructorParamsThatShouldBeRemembered($tableClass)
            ? $tableClass::fromEncryptedState($this->route('state'))
            : $tableClass::make();

        return $table->as($this->route('name'))->setRequest($this);
    }

    /**
     * Ensure that the table has views enabled.
     */
    public function ensureTableHasViews(): self
    {
        abort_if(is_null($this->getTable()->buildViews()), 403, 'Views are not enabled for this table.');

        return $this;
    }
}
