<?php

namespace Modules\Billing\Support;

use Modules\Billing\Models\Contact;
use Modules\Billing\Models\Invoice;

class NotificationRecipients
{
    public static function for(Invoice $invoice, string $channel): array
    {
        $values = Contact::where('customer_id', $invoice->customer_id)->whereNull('archived_at')->where('invoice_emails', true)
            ->pluck($channel === 'sms' ? 'phone' : 'email')->all();

        return array_values(array_unique(array_filter(array_map(fn ($value) => $channel === 'sms' ? DeliveryTemplates::phone($value ?? '') : strtolower(trim($value ?? '')), $values))));
    }
}
