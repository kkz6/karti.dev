<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        foreach (['signature_media_id' => null, 'show_signature_on_invoices' => false] as $key => $value) {
            if (! $this->migrator->exists('billing.'.$key)) {
                $this->migrator->add('billing.'.$key, $value);
            }
        }
    }

    public function down(): void
    {
        $this->migrator->delete('billing.signature_media_id');
        $this->migrator->delete('billing.show_signature_on_invoices');
    }
};
