<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        if (! $this->migrator->exists('billing.payment_methods')) {
            $this->migrator->add('billing.payment_methods', ['bank_transfer', 'upi', 'cash', 'other']);
        }
    }

    public function down(): void
    {
        $this->migrator->delete('billing.payment_methods');
    }
};
