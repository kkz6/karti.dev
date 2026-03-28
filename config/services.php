<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'calcom' => [
        'api_key'       => env('CALCOM_API_KEY', ''),
        'event_type_id' => env('CALCOM_EVENT_TYPE_ID', ''),
        'api_version'   => '2024-09-04',
        'base_url'      => 'https://api.cal.com/v2',
    ],

    'dodo_payments' => [
        'api_key'                 => env('DODO_PAYMENTS_API_KEY', ''),
        'product_id'              => env('DODO_PAYMENTS_UPWORK_PRODUCT_ID', ''),
        'upwork_consultation_url' => env('DODO_PAYMENTS_UPWORK_CONSULTATION_URL', '#'),
        'contact_email'           => env('DODO_PAYMENTS_CONTACT_EMAIL', ''),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel'              => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
