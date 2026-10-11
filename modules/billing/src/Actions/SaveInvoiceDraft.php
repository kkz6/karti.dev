<?php

namespace Modules\Billing\Actions;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Services\InvoiceCalculator;
use Modules\Billing\Settings\BillingSettings;

class SaveInvoiceDraft
{
    public function __construct(private InvoiceCalculator $calculator, private ValidateDraftReferences $references) {}

    public function handle(array $data, ?Invoice $invoice = null): Invoice
    {
        return DB::transaction(function () use ($data, $invoice) {
            $invoice  = $invoice ? Invoice::whereKey($invoice->id)->lockForUpdate()->firstOrFail() : new Invoice;
            $customer = $this->references->check($data, $invoice->exists ? $invoice : null, true);
            $totals   = $this->calculator->calculate($data);
            if (! $invoice->exists || $invoice->customer_id !== $customer->id || ($data['refresh_customer'] ?? false)) {
                $invoice->customer_snapshot = $this->customerSnapshot($customer);
            }
            if (! $invoice->exists) {
                $invoice->seller_snapshot = Arr::only(app(BillingSettings::class)->toArray(), ['display_name', 'legal_name', 'address', 'address_line_2', 'city', 'state', 'postal_code', 'country', 'tax_identifier', 'email', 'phone', 'logo_media_id']);
            }
            $invoice->fill(Arr::only($data, ['customer_id', 'invoice_date', 'due_date', 'currency', 'discount_mode', 'discount_value', 'customer_note', 'internal_note', 'terms', 'payment_instructions']));
            $invoice->currency_precision = $totals['precision'];
            foreach (['subtotal_minor', 'discount_minor', 'tax_minor', 'total_minor'] as $field) {
                $invoice->$field = $totals[$field];
            }
            $invoice->customer_name = $invoice->customer_snapshot['display_name'];
            $invoice->status        = 'draft';
            $invoice->version       = $invoice->exists ? $invoice->version + 1 : 1;
            $invoice->save();
            // Recreate children atomically. Client keys survive and identify the saved line snapshots.
            $invoice->items()->get()->each(fn ($item) => $item->delete());
            foreach ($data['items'] as $position => $input) {
                $lineTotals = $totals['lines'][$position];
                $item       = $invoice->items()->create([
                    ...Arr::only($input, ['key', 'service_id', 'description', 'additional_description', 'unit', 'quantity', 'rate']),
                    ...Arr::only($lineTotals, ['gross_minor', 'discount_minor', 'net_minor', 'tax_minor', 'total_minor']), 'position' => $position,
                ]);
                foreach ($lineTotals['taxes'] as $tax) {
                    $item->taxes()->create(Arr::only($tax, ['tax_rate_id', 'name', 'percentage', 'amount_minor']));
                }
            }

            $invoice->recordActivity($invoice->version === 1 ? 'draft_created' : 'draft_updated', 'Draft saved (version '.$invoice->version.').', \Illuminate\Support\Facades\Auth::user());

            return $invoice->refresh();
        });
    }

    private function customerSnapshot(Customer $customer): array
    {
        return [...Arr::only($customer->toArray(), ['display_name', 'legal_name', 'phone', 'tax_identifier', 'billing_address', 'billing_address_line_2', 'billing_city', 'billing_state', 'billing_postal_code', 'billing_country']),
            'contacts' => $customer->contacts()->whereNull('archived_at')->where('invoice_emails', true)->get(['name', 'email', 'phone', 'primary_slot'])->toArray(),
        ];
    }
}
