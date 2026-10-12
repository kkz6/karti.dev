<?php

namespace Modules\Shared\Tables;

use Modules\Table\Columns\DateColumn;
use Modules\Table\Filters\Clause;

trait HasTrashColumns
{
    protected function deletionDateColumns(): array
    {
        $trash = $this->getTableRequest()->filters()['deleted_at'] ?? null;
        if (! $trash?->enabled || ! in_array($trash->clause, [Clause::OnlyTrashed, Clause::WithTrashed], true)) {
            return [];
        }

        return [DateColumn::make('deleted_at', 'Deleted at', toggleable: false)->sortable()];
    }
}
