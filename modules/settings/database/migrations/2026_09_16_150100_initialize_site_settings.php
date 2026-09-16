<?php

use Modules\Settings\Models\SiteSetting;
use Modules\Settings\Settings\SiteSettings;
use Spatie\LaravelSettings\Migrations\SettingsMigration;

return new class extends SettingsMigration
{
    public function up(): void
    {
        $defaults = SiteSettings::defaults();
        // Preserve any earlier site identity values; other legacy settings stay untouched.
        $legacyKeys = ['name' => 'site_name', 'title' => 'site_title', 'description' => 'site_description', 'author' => 'author_name'];
        foreach ($defaults as $name => $value) {
            $legacy = isset($legacyKeys[$name]) ? SiteSetting::getValue($legacyKeys[$name]) : null;
            $this->migrator->add('site.'.$name, is_string($legacy) && trim($legacy) !== '' ? $legacy : $value);
        }
    }

    public function down(): void
    {
        foreach (array_keys(SiteSettings::defaults()) as $name) {
            $this->migrator->delete('site.'.$name);
        }
    }
};
