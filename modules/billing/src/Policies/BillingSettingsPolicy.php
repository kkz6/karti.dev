<?php

namespace Modules\Billing\Policies;

use Modules\Auth\Models\User;

class BillingSettingsPolicy
{
    public function before(User $user): ?bool
    {
        return $user->hasRole('super-admin') ? true : null;
    }

    public function view(User $user): bool
    {
        return $user->can('view billing settings');
    }

    public function update(User $user): bool
    {
        return $user->can('update billing settings');
    }
}
