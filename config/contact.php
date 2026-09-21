<?php

$turnstileSiteKey = (string) env('TURNSTILE_SITE_KEY', '');
$turnstileSecret  = (string) env('TURNSTILE_SECRET_KEY', '');

return [
    'notification_email' => env('CONTACT_NOTIFICATION_EMAIL'),

    'minimum_form_seconds' => (int) env('CONTACT_MINIMUM_FORM_SECONDS', 2),

    'turnstile' => [
        'enabled'    => (bool) env('TURNSTILE_ENABLED', $turnstileSiteKey !== '' && $turnstileSecret !== ''),
        'site_key'   => $turnstileSiteKey,
        'secret_key' => $turnstileSecret,
        'verify_url' => 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        'timeout'    => 5,
    ],
];
