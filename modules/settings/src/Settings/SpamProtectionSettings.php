<?php

namespace Modules\Settings\Settings;

use Spatie\LaravelSettings\Attributes\ShouldBeEncrypted;
use Spatie\LaravelSettings\Settings;

class SpamProtectionSettings extends Settings
{
    public bool $enabled = false;

    public string $site_key = '';

    #[ShouldBeEncrypted]
    public string $secret_key = '';

    public static function group(): string
    {
        return 'spam_protection';
    }
}
