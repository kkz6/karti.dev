<?php

namespace Modules\Billing\Settings;

use Spatie\LaravelSettings\Attributes\ShouldBeEncrypted;
use Spatie\LaravelSettings\Settings;

class BillingDeliverySettings extends Settings
{
    public bool $sms_enabled = false;

    public string $sms_provider = 'twilio';

    public string $twilio_account_sid = '';

    #[ShouldBeEncrypted]
    public string $twilio_auth_token = '';

    public string $twilio_from = '';

    #[ShouldBeEncrypted]
    public string $msg91_auth_key = '';

    public array $msg91_templates = [];

    public array $templates = [];

    public static function group(): string
    {
        return 'billing_delivery';
    }
}
