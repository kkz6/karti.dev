<?php

namespace Modules\Billing\Actions;

use Illuminate\Support\Facades\DB;
use Modules\Billing\Models\Service;
use Modules\Billing\Models\TaxRate;

class SetCatalogueArchived
{
    public function handle(Service|TaxRate $record, bool $archive): void
    {
        DB::transaction(function () use ($record, $archive) {
            $locked              = $record->newQuery()->whereKey($record->id)->lockForUpdate()->firstOrFail();
            $locked->archived_at = $archive ? ($locked->archived_at ?? now()) : null;
            $locked->save();
        });
    }
}
