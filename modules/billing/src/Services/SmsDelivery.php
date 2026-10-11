<?php

namespace Modules\Billing\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Modules\Billing\Exceptions\SmsDeliveryException;
use Modules\Billing\Settings\BillingDeliverySettings;

class SmsDelivery
{
    public function settings(): BillingDeliverySettings
    {
        // Queue workers must see settings changed since they started.
        app()->forgetInstance(BillingDeliverySettings::class);

        return app(BillingDeliverySettings::class);
    }

    public function send(string $provider, string $phone, string $message, array $payload = []): string
    {
        $settings = $this->settings();
        if (! $settings->sms_enabled) {
            throw new SmsDeliveryException('SMS delivery is disabled.');
        }
        try {
            if ($provider === 'twilio') {
                if (! preg_match('/^AC[a-fA-F0-9]{32}$/D', $settings->twilio_account_sid) || $settings->twilio_auth_token === '' || $settings->twilio_from === '') {
                    throw new SmsDeliveryException('Twilio credentials or sender are missing.');
                }
                $response = Http::asForm()->withBasicAuth($settings->twilio_account_sid, $settings->twilio_auth_token)
                    ->connectTimeout(10)->timeout(30)->post('https://api.twilio.com/2010-04-01/Accounts/'.$settings->twilio_account_sid.'/Messages.json', ['To' => $phone, 'From' => $settings->twilio_from, 'Body' => $message]);
                $reference = $response->json('sid');
                $accepted  = $response->successful() && is_string($reference) && preg_match('/^SM[a-fA-F0-9]{32}$/D', $reference) && ! in_array($response->json('status'), ['failed', 'undelivered'], true);
            } elseif ($provider === 'msg91') {
                if ($settings->msg91_auth_key === '' || empty($payload['template_id'])) {
                    throw new SmsDeliveryException('MSG91 credentials or the approved event template are missing.');
                }
                $response = Http::withHeaders(['authkey' => $settings->msg91_auth_key])->acceptJson()
                    ->connectTimeout(10)->timeout(30)->post('https://control.msg91.com/api/v5/flow', [
                        'template_id' => $payload['template_id'], 'short_url' => '0',
                        'recipients'  => [['mobiles' => ltrim($phone, '+'), ...($payload['variables'] ?? [])]],
                    ]);
                $reference = $response->json('request_id') ?? $response->json('message');
                $accepted  = $response->successful() && $response->json('type') === 'success' && is_string($reference) && $reference !== '';
            } else {
                throw new SmsDeliveryException('Choose a supported SMS provider.');
            }
        } catch (ConnectionException) {
            // A timed-out request may already have been accepted; never retry it blindly.
            throw new SmsDeliveryException('SMS outcome is unknown. Check provider history before resending.', true);
        }
        if (! $accepted) {
            throw new SmsDeliveryException('The SMS provider did not confirm acceptance. Check its delivery logs and settings.', $response->serverError() || $response->successful());
        }

        return substr($reference, 0, 255);
    }
}
