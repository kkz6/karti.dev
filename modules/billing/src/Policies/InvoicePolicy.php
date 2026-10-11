<?php

namespace Modules\Billing\Policies;

use Modules\Billing\Models\Invoice;
use Modules\Shared\Policies\BasePolicy;

class InvoicePolicy extends BasePolicy
{
    protected string $model = Invoice::class;

    public function checkout(\Modules\Auth\Models\User $user, Invoice $invoice): \Illuminate\Auth\Access\Response
    {
        return $this->checkPermission('checkout', $user);
    }

    public function remind(\Modules\Auth\Models\User $user, Invoice $invoice): \Illuminate\Auth\Access\Response
    {
        return $this->checkPermission('remind', $user);
    }

    public function share(\Modules\Auth\Models\User $user, Invoice $invoice): \Illuminate\Auth\Access\Response
    {
        return $this->checkPermission('share', $user);
    }

    public function send(\Modules\Auth\Models\User $user, Invoice $invoice): \Illuminate\Auth\Access\Response
    {
        return $this->checkPermission('send', $user);
    }

    public function download(\Modules\Auth\Models\User $user, Invoice $invoice): \Illuminate\Auth\Access\Response
    {
        return $this->checkPermission('download', $user);
    }

    public function issue(\Modules\Auth\Models\User $user, Invoice $invoice): \Illuminate\Auth\Access\Response
    {
        return $this->checkPermission('issue', $user);
    }

    public function cancel(\Modules\Auth\Models\User $user, Invoice $invoice): \Illuminate\Auth\Access\Response
    {
        return $this->checkPermission('cancel', $user);
    }
}
