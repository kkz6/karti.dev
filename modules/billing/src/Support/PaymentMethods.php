<?php

namespace Modules\Billing\Support;

use Modules\Billing\Settings\BillingSettings;

class PaymentMethods
{
    public const LABELS = ['bank_transfer' => 'Bank transfer', 'upi' => 'UPI', 'cash' => 'Cash', 'cheque' => 'Cheque', 'other' => 'Other'];

    public static function options(bool $enabledOnly = true): array
    {
        $enabled = app(BillingSettings::class)->payment_methods;
        $result  = [];
        foreach (self::LABELS as $value => $label) {
            if (! $enabledOnly || in_array($value, $enabled, true)) {
                $result[] = compact('value', 'label');
            }
        }

        return $result;
    }
}
