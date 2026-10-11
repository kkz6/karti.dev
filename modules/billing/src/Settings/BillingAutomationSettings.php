<?php

namespace Modules\Billing\Settings;

use Spatie\LaravelSettings\Settings;

class BillingAutomationSettings extends Settings
{
    public bool $reminders_enabled=false;

    public array $reminder_offsets=[0, 3, 7, 14];

    public static function group(): string
    {
        return 'billing_automation';
    }
}
