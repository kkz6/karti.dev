<?php

namespace Modules\Billing\Actions;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Billing\Models\Service;
use Modules\Billing\Models\TaxRate;

class SaveService
{
    public function handle(array $data, ?Service $service = null): Service
    {
        return DB::transaction(function () use ($data, $service) {
            $service = $service ? Service::whereKey($service->id)->lockForUpdate()->firstOrFail() : new Service;
            abort_if($service->archived_at !== null, 409, 'Restore this service before editing it.');
            $currentIds = $service->exists ? $service->taxRates()->pluck('billing_tax_rates.id')->all() : [];
            $taxes      = TaxRate::whereIn('id', $data['tax_rate_ids'])->orderBy('id')->lockForUpdate()->get();
            if ($taxes->count() !== count($data['tax_rate_ids']) || $taxes->contains(fn ($tax) => $tax->archived_at !== null && ! in_array($tax->id, $currentIds, true))) {
                throw ValidationException::withMessages(['tax_rate_ids' => 'Select active tax presets. Existing archived selections may be kept or removed.']);
            }
            $service->fill(Arr::except($data, ['tax_rate_ids']))->save();
            $service->taxRates()->sync($data['tax_rate_ids']);

            return $service;
        });
    }
}
