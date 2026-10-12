<?php

namespace Modules\Billing\Settings;

use Spatie\LaravelSettings\Settings;

class BillingSettings extends Settings
{
    public string $display_name = '';

    public string $legal_name = '';

    public string $address = '';

    public string $address_line_2 = '';

    public string $city = '';

    public string $state = '';

    public string $postal_code = '';

    public string $country = '';

    public string $tax_identifier = '';

    public string $email = '';

    public string $phone = '';

    public ?int $logo_media_id = null;

    public ?int $signature_media_id = null;

    public bool $show_signature_on_invoices = false;

    public string $timezone = 'Asia/Kolkata';

    public string $default_currency = '';

    public int $due_days = 30;

    public string $number_prefix = 'INV-';

    public int $number_padding = 6;

    public string $default_terms = '';

    public string $payment_instructions = '';

    public array $payment_methods = ['bank_transfer', 'upi', 'cash', 'other'];

    public static function group(): string
    {
        return 'billing';
    }

    public static function defaults(): array
    {
        return [
            'display_name'     => '', 'legal_name' => '', 'address' => '', 'address_line_2' => '',
            'city'             => '', 'state' => '', 'postal_code' => '', 'country' => '', 'tax_identifier' => '',
            'email'            => '', 'phone' => '', 'logo_media_id' => null, 'signature_media_id' => null, 'show_signature_on_invoices' => false, 'timezone' => 'Asia/Kolkata',
            'default_currency' => '', 'due_days' => 30, 'number_prefix' => 'INV-', 'number_padding' => 6,
            'default_terms'    => '', 'payment_instructions' => '', 'payment_methods' => ['bank_transfer', 'upi', 'cash', 'other'],
        ];
    }
}
