<?php

namespace Modules\Billing\Settings;

use Spatie\LaravelSettings\Settings;

class BillingAutomationSettings extends Settings
{
    public bool $reminders_enabled=false;

    public array $reminder_offsets=[0, 3, 7, 14];

    public bool $reminder_email = true;

    public bool $reminder_sms = false;

    public bool $receipt_email = false;

    public bool $receipt_sms = false;

    public static function group(): string
    {
        return 'billing_automation';
    }
}
