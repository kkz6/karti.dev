<?php

namespace Modules\Settings\Support;

use Closure;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Modules\Settings\Settings\EmailSettings;

class EmailConfiguration
{
    public function run(Closure $callback): mixed
    {
        $settings = $this->settings();

        if (! $settings?->enabled) {
            return $callback();
        }

        $original = config('mail');
        $this->apply($settings);

        try {
            return $callback();
        } finally {
            config(['mail' => $original]);
            Mail::purge('smtp');
        }
    }

    public function apply(EmailSettings $settings): void
    {
        config([
            'mail.default'                  => 'smtp',
            'mail.mailers.smtp.scheme'      => $settings->encryption === 'ssl' ? 'smtps' : 'smtp',
            'mail.mailers.smtp.url'         => null,
            'mail.mailers.smtp.host'        => $settings->host,
            'mail.mailers.smtp.port'        => $settings->port,
            'mail.mailers.smtp.username'    => $settings->username !== '' ? $settings->username : null,
            'mail.mailers.smtp.password'    => $settings->password !== '' ? $settings->password : null,
            'mail.from.address'             => $settings->from_address,
            'mail.from.name'                => $settings->from_name,
        ]);

        // Mailers are cached in long-lived workers, so rebuild SMTP after applying fresh settings.
        Mail::purge('smtp');
    }

    private function settings(): ?EmailSettings
    {
        if (! Schema::hasTable('settings')) {
            return null;
        }

        app()->forgetInstance(EmailSettings::class);

        return app(EmailSettings::class);
    }
}
