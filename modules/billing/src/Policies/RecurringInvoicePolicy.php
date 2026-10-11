<?php

namespace Modules\Billing\Policies;

use Modules\Billing\Models\RecurringInvoice;
use Modules\Shared\Policies\BasePolicy;

class RecurringInvoicePolicy extends BasePolicy
{
    protected string $model=RecurringInvoice::class;

    protected function getModelName(): string
    {
        return 'recurring invoice';
    }
}
