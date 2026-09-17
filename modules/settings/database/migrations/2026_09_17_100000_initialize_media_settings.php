<?php

use Modules\Settings\Settings\MediaSettings;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $this->migrator->add('media.presets', MediaSettings::defaultPresets());
    }

    public function down(): void
    {
        $this->migrator->delete('media.presets');
    }
};
