<?php

namespace Modules\Billing\Support;

use Modules\Billing\Models\PaymentMethod;
use Modules\Billing\Settings\BillingSettings;

class PaymentMethods
{
    public const LABELS = ['bank_transfer' => 'Bank transfer', 'upi' => 'UPI', 'cash' => 'Cash', 'cheque' => 'Cheque', 'other' => 'Other'];

    public static function options(bool $enabledOnly = true): array
    {
        $enabled = app(BillingSettings::class)->payment_methods;

        return PaymentMethod::where('manual', true)->orderBy('name')->get()->filter(fn ($method) => ! $enabledOnly || ($method->enabled && (! isset(self::LABELS[$method->code]) || in_array($method->code, $enabled, true))))
            ->map(fn ($method) => ['value' => $method->code, 'label' => $method->name])->values()->all();
    }

    public static function resolve(string $code, string $label, bool $system = false): PaymentMethod
    {
        if ($code === 'imported') {
            $code = 'imported_'.substr(hash('sha256', $label), 0, 32);
        }

        return PaymentMethod::firstOrCreate(['code' => $code], ['name' => $label, 'enabled' => true, 'manual' => ! $system, 'created_at' => now()]);
    }

    public static function syncEnabled(): void
    {
        app(BillingSettings::class)->fill(['payment_methods' => PaymentMethod::where('manual', true)->where('enabled', true)->pluck('code')->all()])->save();
    }
}
