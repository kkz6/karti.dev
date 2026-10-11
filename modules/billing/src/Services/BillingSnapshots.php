<?php

namespace Modules\Billing\Services;

use Illuminate\Support\Arr;
use Modules\Billing\Models\Customer;
use Modules\Billing\Settings\BillingSettings;

class BillingSnapshots
{
    public static function customer(Customer $customer): array
    {
        return [...Arr::only($customer->toArray(), ['display_name', 'legal_name', 'phone', 'tax_identifier', 'billing_address', 'billing_address_line_2', 'billing_city', 'billing_state', 'billing_postal_code', 'billing_country']),
            'contacts' => $customer->contacts()->whereNull('archived_at')->where('invoice_emails', true)->get(['name', 'email', 'phone', 'primary_slot'])->toArray()];
    }

    public static function seller(): array
    {
        return Arr::only(app(BillingSettings::class)->toArray(), ['display_name', 'legal_name', 'address', 'address_line_2', 'city', 'state', 'postal_code', 'country', 'tax_identifier', 'email', 'phone', 'logo_media_id']);
    }
}
