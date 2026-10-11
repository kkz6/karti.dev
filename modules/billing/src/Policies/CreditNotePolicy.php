<?php

namespace Modules\Billing\Policies;

use Modules\Billing\Models\CreditNote;
use Modules\Shared\Policies\BasePolicy;

class CreditNotePolicy extends BasePolicy
{
    protected string $model=CreditNote::class;

    protected function getModelName(): string
    {
        return 'credit note';
    }
}
