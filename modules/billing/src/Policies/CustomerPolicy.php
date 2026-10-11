<?php

namespace Modules\Billing\Policies;

use Illuminate\Auth\Access\Response;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Customer;
use Modules\Shared\Policies\BasePolicy;

class CustomerPolicy extends BasePolicy
{
    protected string $model = Customer::class;

    public function archive(User $user, Customer $customer): Response
    {
        return $this->checkPermission('archive', $user);
    }
}
