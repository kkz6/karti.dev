<?php

namespace Modules\Billing\Policies;

use Illuminate\Auth\Access\Response;
use Modules\Auth\Models\User;
use Modules\Billing\Models\TaxRate;
use Modules\Shared\Policies\BasePolicy;

class TaxRatePolicy extends BasePolicy
{
    protected string $model = TaxRate::class;

    protected function getModelName(): string
    {
        return 'tax rate';
    }

    public function archive(User $user, TaxRate $taxRate): Response
    {
        return $this->checkPermission('archive', $user);
    }
}
