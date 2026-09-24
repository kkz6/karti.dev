<?php

namespace Modules\Settings\Settings;

use Spatie\LaravelSettings\Attributes\ShouldBeEncrypted;
use Spatie\LaravelSettings\Settings;

class EmailSettings extends Settings
{
    public bool $enabled = false;

    public string $provider = 'smtp';

    public string $host = '';

    public int $port = 587;

    public string $username = '';

    #[ShouldBeEncrypted]
    public string $password = '';

    #[ShouldBeEncrypted]
    public string $resend_api_key = '';

    public string $encryption = 'tls';

    public string $from_address = '';

    public string $from_name = '';

    public static function group(): string
    {
        return 'email';
    }
}
