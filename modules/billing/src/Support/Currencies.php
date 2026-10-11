<?php

namespace Modules\Billing\Support;

class Currencies
{
    // Initial supported catalogue currencies; precision is metadata for the invoice stage.
    public const DEFINITIONS = [
        'INR' => ['name' => 'Indian rupee', 'precision' => 2],
        'USD' => ['name' => 'US dollar', 'precision' => 2],
        'EUR' => ['name' => 'Euro', 'precision' => 2],
        'GBP' => ['name' => 'British pound', 'precision' => 2],
        'AUD' => ['name' => 'Australian dollar', 'precision' => 2],
        'CAD' => ['name' => 'Canadian dollar', 'precision' => 2],
        'SGD' => ['name' => 'Singapore dollar', 'precision' => 2],
        'JPY' => ['name' => 'Japanese yen', 'precision' => 0],
        'AED' => ['name' => 'UAE dirham', 'precision' => 2],
        'CHF' => ['name' => 'Swiss franc', 'precision' => 2],
    ];

    public static function codes(): array
    {
        return array_keys(self::DEFINITIONS);
    }

    public static function options(): array
    {
        return collect(self::DEFINITIONS)->map(fn ($definition, $code) => [
            'code' => $code, 'name' => $definition['name'], 'precision' => $definition['precision'],
        ])->values()->all();
    }
}
