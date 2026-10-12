<?php

namespace Modules\Billing\Services;

use Modules\Billing\Contracts\PaymentGateway;
use Modules\Billing\Contracts\PaymentProvider;
use Modules\Billing\Settings\BillingProviderSettings;
use RuntimeException;

class PaymentGatewayRegistry
{
    private array $gateways = [];

    public function register(PaymentGateway $gateway): void
    {
        $id = $gateway->id();
        if (! preg_match('/^[a-z][a-z0-9_-]{1,63}$/D', $id) || isset($this->gateways[$id]) || ! is_a($gateway->providerClass(), PaymentProvider::class, true)) {
            throw new RuntimeException('Payment gateway IDs must be unique and their adapter must implement PaymentProvider.');
        }
        $this->gateways[$id] = $gateway;
    }

    public function all(): array
    {
        return $this->gateways;
    }

    public function get(string $id): PaymentGateway
    {
        return $this->gateways[$id] ?? throw new RuntimeException('This payment provider package is not installed.');
    }

    public function defaultId(): string
    {
        return app(BillingProviderSettings::class)->default_provider;
    }

    public function enabled(string $id): bool
    {
        return isset($this->gateways[$id]) && in_array($id, app(BillingProviderSettings::class)->enabled_providers, true);
    }

    public function checkoutAvailable(): bool
    {
        $settings = app(BillingProviderSettings::class);
        $id       = $settings->default_provider;
        if (! $settings->invoice_checkout_enabled || ! $settings->document_policy_confirmed || ! $this->enabled($id)) {
            return false;
        }
        $configuration = $this->configuration($id);
        foreach ($this->get($id)->fields() as $key => $field) {
            if (($field['required'] ?? false) && ! filled($configuration[$key] ?? null)) {
                return false;
            }
        }

        return true;
    }

    public function make(string $id): PaymentProvider
    {
        return app($this->get($id)->providerClass());
    }

    public function adapter(string $id): PaymentProvider
    {
        return $id === $this->defaultId() ? app(PaymentProvider::class) : $this->make($id);
    }

    public function configuration(string $id): array
    {
        app()->forgetInstance(BillingProviderSettings::class);
        $saved    = app(BillingProviderSettings::class)->provider_settings[$id] ?? [];
        $defaults = array_map(fn ($field) => $field['default'] ?? '', $this->get($id)->fields());

        return array_replace($defaults, $saved);
    }

    public function validateCheckoutUrl(string $id, string $url): void
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        foreach ($this->get($id)->checkoutHosts() as $allowed) {
            if (parse_url($url, PHP_URL_SCHEME) === 'https' && ! parse_url($url, PHP_URL_USER) && ! parse_url($url, PHP_URL_PASS)
                && ($host === $allowed || (str_starts_with($allowed, '*.') && str_ends_with($host, substr($allowed, 1))))) {
                return;
            }
        }
        throw new RuntimeException('The provider returned an unapproved checkout destination.');
    }
}
