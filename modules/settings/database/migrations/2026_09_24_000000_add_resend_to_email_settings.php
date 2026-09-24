<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('email.provider', 'smtp');
        $this->migrator->addEncrypted('email.resend_api_key', '');
    }

    public function down(): void
    {
        $this->migrator->delete('email.provider');
        $this->migrator->delete('email.resend_api_key');
    }
};
