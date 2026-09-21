<?php

namespace Modules\Frontend\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class Turnstile
{
    public function configured(): bool
    {
        return $this->siteKey() !== '' && $this->secretKey() !== '';
    }

    public function enabled(): bool
    {
        return (bool) config('contact.turnstile.enabled') && $this->configured();
    }

    public function siteKey(): string
    {
        return (string) config('contact.turnstile.site_key', '');
    }

    public function verify(string $token, ?string $ipAddress = null, string $action = 'contact'): bool
    {
        if (! $this->enabled()) {
            return true;
        }

        try {
            $response = Http::asForm()
                ->connectTimeout(2)
                ->timeout((int) config('contact.turnstile.timeout', 5))
                ->post((string) config('contact.turnstile.verify_url'), array_filter([
                    'secret'   => $this->secretKey(),
                    'response' => $token,
                    'remoteip' => $ipAddress,
                ]));

            if (! $response->successful()) {
                Log::warning('Turnstile verification request failed.', ['status' => $response->status()]);

                return false;
            }

            $result = $response->json();

            return ($result['success'] ?? false) === true
                && (($result['action'] ?? $action) === $action);
        } catch (Throwable $exception) {
            Log::warning('Turnstile verification could not be completed.', [
                'exception' => $exception::class,
                'message'   => $exception->getMessage(),
            ]);

            return false;
        }
    }

    private function secretKey(): string
    {
        return (string) config('contact.turnstile.secret_key', '');
    }
}
