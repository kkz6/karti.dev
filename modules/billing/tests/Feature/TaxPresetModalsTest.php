<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Service;
use Modules\Billing\Models\TaxRate;
use Modules\Billing\Tables\TaxRates;

uses(RefreshDatabase::class);
beforeEach(fn () => $this->actingAs(User::factory()->create()->assignRole('admin')));

test('tax presets provide JSON for modals and modal saves return to the listing', function () {
    $tax = TaxRate::factory()->create(['percentage'=>'7.1250']);
    $this->getJson(route('admin.tax-rates.edit', $tax))->assertOk()->assertJsonPath('taxRate.percentage', '7.1250')->assertJsonPath('readOnly', false);
    $this->getJson(route('admin.tax-rates.show', $tax))->assertOk()->assertJsonPath('readOnly', true);
    $this->withHeaders(['X-Billing-Modal'=>'1'])->patch(route('admin.tax-rates.update', $tax), ['name'=>'New label', 'percentage'=>'8.5'])->assertRedirect(route('admin.settings.billing.edit', ['section'=>'taxes']));
    expect($tax->fresh()->percentage)->toBe('8.5000');
    expect(collect(TaxRates::make()->actions())->pluck('label')->all())->toBe(['View', 'Edit', 'Archive', 'Restore', 'Delete']);
});

test('unused tax presets can be deleted and used presets return a useful validation error', function () {
    $unused = TaxRate::factory()->create();
    $this->delete(route('admin.tax-rates.destroy', $unused))->assertRedirect()->assertSessionHas('success');
    expect($unused->fresh())->toBeNull();
    $tax     = TaxRate::factory()->create();
    $service = Service::factory()->create();
    $service->taxRates()->attach($tax);
    $this->deleteJson(route('admin.tax-rates.destroy', $tax))->assertJsonValidationErrors('tax_preset');
    $service->taxRates()->detach();
    app(SaveInvoiceDraft::class)->handle(['customer_id'=>Customer::factory()->create()->id, 'invoice_date'=>now()->format('Y-m-d'), 'currency'=>'INR', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>(string) Str::uuid(), 'description'=>'Taxed line', 'unit'=>'item', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[['tax_rate_id'=>$tax->id, 'name'=>$tax->name, 'percentage'=>$tax->percentage]]]]]);
    $this->deleteJson(route('admin.tax-rates.destroy', $tax))->assertJsonValidationErrors('tax_preset');
    expect($tax->fresh())->not->toBeNull();
});

test('read only tax users cannot edit or delete presets', function () {
    $tax = TaxRate::factory()->create();
    $this->actingAs(User::factory()->create()->givePermissionTo(['view any tax rate', 'view tax rate']));
    $this->getJson(route('admin.tax-rates.show', $tax))->assertOk();
    $this->getJson(route('admin.tax-rates.edit', $tax))->assertForbidden();
    $this->deleteJson(route('admin.tax-rates.destroy', $tax))->assertForbidden();
});
