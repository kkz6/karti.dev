<?php

use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('email.enabled', false);
        $this->migrator->add('email.host', '');
        $this->migrator->add('email.port', 587);
        $this->migrator->add('email.username', '');
        $this->migrator->addEncrypted('email.password', '');
        $this->migrator->add('email.encryption', 'tls');
        $this->migrator->add('email.from_address', (string) config('mail.from.address', ''));
        $this->migrator->add('email.from_name', (string) config('mail.from.name', config('app.name', '')));
    }

    public function down(): void
    {
        foreach (['enabled', 'host', 'port', 'username', 'password', 'encryption', 'from_address', 'from_name'] as $name) {
            $this->migrator->delete('email.'.$name);
        }
    }
};
