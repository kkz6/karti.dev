<?php

namespace Modules\Settings\Settings;

use Spatie\LaravelSettings\Attributes\ShouldBeEncrypted;
use Spatie\LaravelSettings\Settings;

class EmailSettings extends Settings
{
    public bool $enabled = false;

    public string $host = '';

    public int $port = 587;

    public string $username = '';

    #[ShouldBeEncrypted]
    public string $password = '';

    public string $encryption = 'tls';

    public string $from_address = '';

    public string $from_name = '';

    public static function group(): string
    {
        return 'email';
    }
}
