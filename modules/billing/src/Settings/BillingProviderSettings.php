<?php

namespace Modules\Billing\Settings;

use Spatie\LaravelSettings\Settings;

class BillingProviderSettings extends Settings
{
    public bool $invoice_checkout_enabled=false;

    public string $invoice_product_id='';

    public bool $document_policy_confirmed=false;

    public static function group(): string
    {
        return 'billing_provider';
    }
}
