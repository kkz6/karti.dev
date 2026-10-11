<?php

namespace Modules\Billing\Policies;

use Illuminate\Auth\Access\Response;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Service;
use Modules\Shared\Policies\BasePolicy;

class ServicePolicy extends BasePolicy
{
    protected string $model = Service::class;

    public function archive(User $user, Service $service): Response
    {
        return $this->checkPermission('archive', $user);
    }
}
