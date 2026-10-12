<?php

namespace Modules\Billing\Settings;

use Spatie\LaravelSettings\Settings;

class BillingProviderSettings extends Settings
{
    public bool $invoice_checkout_enabled=false;

    public string $invoice_product_id='';

    public bool $document_policy_confirmed=false;

    public string $default_provider = 'dodo';

    public array $enabled_providers = ['dodo'];

    #[\Spatie\LaravelSettings\Attributes\ShouldBeEncrypted]
    public array $provider_settings = [];

    public static function group(): string
    {
        return 'billing_provider';
    }
}
