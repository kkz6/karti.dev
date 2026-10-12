<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('spam_protection.enabled', (bool) config('contact.turnstile.enabled', false));
        $this->migrator->add('spam_protection.site_key', (string) config('contact.turnstile.site_key', ''));
        $this->migrator->addEncrypted('spam_protection.secret_key', (string) config('contact.turnstile.secret_key', ''));
    }

    public function down(): void
    {
        foreach (['enabled', 'site_key', 'secret_key'] as $key) {
            $this->migrator->delete('spam_protection.'.$key);
        }
    }
};
