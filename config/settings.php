<?php

return [
    'settings'               => [
        Modules\Settings\Settings\SiteSettings::class,
        Modules\Settings\Settings\MediaSettings::class,
        Modules\Settings\Settings\EmailSettings::class,
    ],
    'auto_discover_settings' => [],
    // This application's module loader registers the settings migrations.
    'migrations_paths' => [],
];
