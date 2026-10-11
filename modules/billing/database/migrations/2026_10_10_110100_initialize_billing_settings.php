<?php

use Modules\Billing\Settings\BillingSettings;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        foreach (\Illuminate\Support\Arr::except(BillingSettings::defaults(), ['payment_methods']) as $key => $value) {
            $this->migrator->add('billing.'.$key, $value);
        }
    }

    public function down(): void
    {
        foreach (array_keys(\Illuminate\Support\Arr::except(BillingSettings::defaults(), ['payment_methods'])) as $key) {
            $this->migrator->delete('billing.'.$key);
        }
    }
};
