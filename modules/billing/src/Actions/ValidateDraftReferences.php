<?php

namespace Modules\Billing\Actions;

use Illuminate\Validation\ValidationException;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Service;
use Modules\Billing\Models\TaxRate;

class ValidateDraftReferences
{
    public function check(array $data, ?Invoice $invoice = null, bool $lock = false): Customer
    {
        abort_if($invoice && $invoice->status !== 'draft', 409, 'Only draft invoices can be edited.');
        if ($invoice && $invoice->version !== (int) $data['version']) {
            throw ValidationException::withMessages(['version' => 'This draft changed in another session. Reload it before saving your changes.']);
        }
        $customer = Customer::whereKey($data['customer_id'])->when($lock, fn ($query) => $query->lockForUpdate())->firstOrFail();
        if ($customer->archived_at !== null && $invoice?->customer_id !== $customer->id) {
            throw ValidationException::withMessages(['customer_id' => 'Choose an active customer. Existing drafts retain their archived customer.']);
        }
        $existing = $invoice ? $invoice->items()->with('taxes')->get()->keyBy('key') : collect();
        $services = Service::whereIn('id', array_filter(array_column($data['items'], 'service_id')))->orderBy('id')->when($lock, fn ($query) => $query->lockForUpdate())->get()->keyBy('id');
        $taxIds   = collect($data['items'])->flatMap(fn ($item) => array_column($item['taxes'], 'tax_rate_id'))->filter()->unique();
        $taxRates = TaxRate::whereIn('id', $taxIds)->orderBy('id')->when($lock, fn ($query) => $query->lockForUpdate())->get()->keyBy('id');
        foreach ($data['items'] as $index => $item) {
            $old = $existing->get($item['key']);
            if ($id = $item['service_id'] ?? null) {
                $service  = $services->get((int) $id);
                $retained = $old && $old->service_id === (int) $id && $invoice->currency === $data['currency'];
                if (! $service || (! $retained && ($service->archived_at !== null || $service->currency !== $data['currency']))) {
                    throw ValidationException::withMessages(["items.$index.service_id" => 'Select an active service priced in this currency, or enter a manual line.']);
                }
            }
            foreach ($item['taxes'] as $taxIndex => $tax) {
                if ($id = $tax['tax_rate_id'] ?? null) {
                    $preset   = $taxRates->get((int) $id);
                    $retained = $old && $old->taxes->contains('tax_rate_id', (int) $id);
                    if (! $preset || (! $retained && $preset->archived_at !== null)) {
                        throw ValidationException::withMessages(["items.$index.taxes.$taxIndex.tax_rate_id" => 'Choose an active tax preset or enter a custom tax.']);
                    }
                }
            }
        }

        return $customer;
    }
}
