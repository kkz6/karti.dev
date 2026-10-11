<?php

namespace Modules\Billing\Policies;

use Illuminate\Auth\Access\Response;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Shared\Policies\BasePolicy;

class PaymentPolicy extends BasePolicy
{
    protected string $model = Payment::class;

    public function record(User $user, Invoice $invoice): Response
    {
        return $this->checkPermission('record', $user);
    }

    public function reverse(User $user, Payment $payment): Response
    {
        return $this->checkPermission('reverse', $user);
    }
}
