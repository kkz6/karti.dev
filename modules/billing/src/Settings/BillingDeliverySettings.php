<?php

namespace Modules\Billing\Settings;

use Spatie\LaravelSettings\Attributes\ShouldBeEncrypted;
use Spatie\LaravelSettings\Settings;

class BillingDeliverySettings extends Settings
{
    public bool $sms_enabled = false;

    public string $sms_provider = 'twilio';

    public string $twilio_account_sid = '';

    #[ShouldBeEncrypted]
    public string $twilio_auth_token = '';

    public string $twilio_from = '';

    #[ShouldBeEncrypted]
    public string $msg91_auth_key = '';

    public array $msg91_templates = [];

    public array $templates = [];

    public function resolvedTemplates(): array
    {
        $templates = \Modules\Billing\Support\DeliveryTemplates::defaults();
        foreach ($templates as $event => &$template) {
            foreach ($template as $field => &$value) {
                $saved = $this->templates[$event][$field] ?? null;
                if (is_string($saved) && trim($saved) !== '') {
                    $value = $saved;
                }
            }
            unset($value);
        }
        unset($template);

        return $templates;
    }

    public function resolvedProviderTemplates(): array
    {
        $templates = [];
        foreach (\Modules\Billing\Support\DeliveryTemplates::EVENTS as $event) {
            $saved             = $this->msg91_templates[$event] ?? [];
            $templates[$event] = ['id' => is_string($saved['id'] ?? null) ? $saved['id'] : '',
                'variables'            => is_array($saved['variables'] ?? null) ? $saved['variables'] : []];
        }

        return $templates;
    }

    public static function group(): string
    {
        return 'billing_delivery';
    }
}
