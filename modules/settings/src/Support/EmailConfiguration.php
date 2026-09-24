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

        return $this->runWith($settings, $callback);
    }

    public function runWith(EmailSettings $settings, Closure $callback): mixed
    {
        $originalMail     = config('mail');
        $originalServices = config('services.resend');
        $this->apply($settings);

        try {
            return $callback();
        } finally {
            config([
                'mail'            => $originalMail,
                'services.resend' => $originalServices,
            ]);
            Mail::purge('smtp');
            Mail::purge('resend');
        }
    }

    public function apply(EmailSettings $settings): void
    {
        $provider = $settings->provider === 'resend' ? 'resend' : 'smtp';

        config([
            'mail.default'                  => $provider,
            'mail.mailers.smtp.scheme'      => $settings->encryption === 'ssl' ? 'smtps' : 'smtp',
            'mail.mailers.smtp.url'         => null,
            'mail.mailers.smtp.host'        => $settings->host,
            'mail.mailers.smtp.port'        => $settings->port,
            'mail.mailers.smtp.username'    => $settings->username !== '' ? $settings->username : null,
            'mail.mailers.smtp.password'    => $settings->password !== '' ? $settings->password : null,
            'mail.from.address'             => $settings->from_address,
            'mail.from.name'                => $settings->from_name,
            'services.resend.key'           => $settings->resend_api_key,
        ]);

        // Mailers are cached in long-lived workers, so rebuild both configurable transports.
        Mail::purge('smtp');
        Mail::purge('resend');
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
