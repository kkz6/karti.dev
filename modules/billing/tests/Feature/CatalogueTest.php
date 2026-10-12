<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Service;
use Modules\Billing\Models\TaxRate;
use Modules\Billing\Settings\BillingSettings;
use Modules\Billing\Support\BillingPermissions;
use Modules\Billing\Tables\TaxRates;
use Modules\Media\Models\Media;
use Modules\Media\Support\MediaUsage;
use Modules\Settings\Settings\SiteSettings;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create()->assignRole('admin');
    $this->actingAs($this->admin);
});

function billingSettingsPayload(array $changes = []): array
{
    return array_replace(BillingSettings::defaults(), ['display_name' => ' Example Company ', 'legal_name' => 'Example Company Ltd', 'default_currency' => 'inr', 'country' => 'in', 'email' => ' BILLING@EXAMPLE.ORG ', 'payment_instructions' => 'Transfer to the account shown on your invoice.'], $changes);
}

function billingTestLogo(string $mime = 'image/png'): Media
{
    Storage::fake('public');
    Storage::disk('public')->put('billing/logo.png', 'test image');

    return Media::withoutEvents(fn () => Media::forceCreate(['disk' => 'public', 'directory' => 'billing', 'filename' => 'logo', 'extension' => 'png', 'mime_type' => $mime, 'aggregate_type' => 'image', 'size' => 10]));
}

test('billing defaults do not invent identity currency or taxes', function () {
    $settings = app(BillingSettings::class);
    expect($settings->display_name)->toBe('')->and($settings->legal_name)->toBe('')->and($settings->tax_identifier)->toBe('')->and($settings->default_currency)->toBe('')->and($settings->logo_media_id)->toBeNull()->and($settings->due_days)->toBe(30)->and(TaxRate::count())->toBe(0);
    expect($this->admin->hasAllPermissions(BillingPermissions::ALL))->toBeTrue();
    $this->get(route('admin.settings.billing.edit'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('billing::settings')->where('settings.number_padding', 6)->where('canUpdate', true)->has('currencies', 10));
});

test('billing settings persist independently from site identity', function () {
    $before = app(SiteSettings::class)->toArray();
    $this->put(route('admin.settings.billing.update'), billingSettingsPayload(['logo_media_id' => billingTestLogo()->id, 'due_days' => 0, 'number_prefix' => 'EX-', 'number_padding' => 4]))->assertSessionHasNoErrors()->assertRedirect(route('admin.settings.billing.edit'));
    app()->forgetInstance(BillingSettings::class);
    $saved = app(BillingSettings::class);
    expect($saved->display_name)->toBe('Example Company')->and($saved->default_currency)->toBe('INR')->and($saved->country)->toBe('IN')->and($saved->email)->toBe('billing@example.org')->and($saved->due_days)->toBe(0)->and($saved->number_prefix)->toBe('EX-')->and($saved->number_padding)->toBe(4)->and($saved->logo_media_id)->not->toBeNull()->and(app(SiteSettings::class)->toArray())->toBe($before);
    $this->put(route('admin.settings.billing.update'), billingSettingsPayload(['legal_name' => '', 'logo_media_id' => null]))->assertSessionHasNoErrors();
    app()->forgetInstance(BillingSettings::class);
    expect(app(BillingSettings::class)->logo_media_id)->toBeNull()->and(app(BillingSettings::class)->legal_name)->toBe('');
});

test('billing settings reject unsafe or unsupported values', function (array $changes, string $field) {
    $before = app(BillingSettings::class)->toArray();
    $this->putJson(route('admin.settings.billing.update'), billingSettingsPayload($changes))->assertUnprocessable()->assertJsonValidationErrors($field);
    app()->forgetInstance(BillingSettings::class);
    expect(app(BillingSettings::class)->toArray())->toBe($before);
})->with([
    [['timezone' => 'Mars/Olympus'], 'timezone'], [['due_days' => -1], 'due_days'], [['due_days' => 366], 'due_days'],
    [['default_currency' => 'ZZZ'], 'default_currency'], [['number_padding' => 0], 'number_padding'], [['number_padding' => 11], 'number_padding'],
    [['number_prefix' => '<script>'], 'number_prefix'], [['logo_media_id' => 9999], 'logo_media_id'], [['email' => 'invalid'], 'email'],
]);

test('billing logo must be an original supported raster image', function () {
    $logo = billingTestLogo('image/svg+xml');
    $this->putJson(route('admin.settings.billing.update'), billingSettingsPayload(['logo_media_id' => $logo->id]))->assertUnprocessable()->assertJsonValidationErrors('logo_media_id');
    $logo->forceFill(['mime_type' => 'image/png', 'original_media_id' => $logo->id])->saveQuietly();
    $this->putJson(route('admin.settings.billing.update'), billingSettingsPayload(['logo_media_id' => $logo->id]))->assertUnprocessable()->assertJsonValidationErrors('logo_media_id');
});

test('selected billing logo is protected from deletion and its ID survives location changes', function () {
    $logo = billingTestLogo();
    app(BillingSettings::class)->fill(['logo_media_id' => $logo->id])->save();
    $usage = app(MediaUsage::class)->forMedia($logo);
    expect(collect($usage['usages'])->firstWhere('type', 'Billing settings')['field'])->toBe('Logo');
    $this->deleteJson(route('media.destroy', $logo))->assertConflict();
    expect($logo->fresh())->not->toBeNull();
    app(\Modules\Media\Support\MediaMover::class)->move($logo, 'billing/new-location');
    app()->forgetInstance(BillingSettings::class);
    expect(app(BillingSettings::class)->logo_media_id)->toBe($logo->id)->and(collect(app(MediaUsage::class)->forMedia($logo)['usages'])->contains('type', 'Billing settings'))->toBeTrue();
});

test('private billing settings are not exposed on public pages', function () {
    $this->put(route('admin.settings.billing.update'), billingSettingsPayload(['payment_instructions' => 'Private transfer reference']))->assertRedirect();
    auth()->logout();
    $this->get('/contact')->assertOk()->assertInertia(fn (Assert $page) => $page->missing('settings')->missing('billingSettings')->where('billingAccess.viewSettings', false));
});

test('unauthorized users cannot use settings tax or table endpoints', function () {
    $tax     = TaxRate::factory()->create();
    $this->actingAs(User::factory()->create());
    $this->get(route('admin.settings.billing.edit'))->assertForbidden();
    $this->put(route('admin.settings.billing.update'), billingSettingsPayload())->assertForbidden();
    foreach (['tax-rates' => $tax] as $prefix => $record) {
        foreach (['index' => [], 'create' => [], 'show' => [$record], 'edit' => [$record]] as $action => $params) {
            $this->get(route('admin.'.$prefix.'.'.$action, $params))->assertForbidden();
        }
        $this->post(route('admin.'.$prefix.'.store'), [])->assertForbidden();
        $this->patch(route('admin.'.$prefix.'.update', $record), [])->assertForbidden();
        $this->post(route('admin.'.$prefix.'.archive', $record))->assertForbidden();
        $this->post(route('admin.'.$prefix.'.restore', $record))->assertForbidden();
    }
    foreach ([TaxRates::class] as $table) {
        $this->get(URL::signedRoute('inertia-tables.export', ['table' => base64_encode($table), 'name' => 'default', 'export' => 0]))->assertForbidden();
        $this->post(URL::signedRoute('inertia-tables.action', ['table' => base64_encode($table), 'name' => 'default', 'action' => 0]), ['keys' => [1]])->assertForbidden();
    }
});

test('read-only catalogue and settings permissions do not allow mutations', function () {
    $reader  = User::factory()->create()->givePermissionTo(['view any tax rate', 'view tax rate', 'view billing settings']);
    $tax     = TaxRate::factory()->create();
    $this->actingAs($reader);
    $this->get(route('admin.tax-rates.show', $tax))->assertOk()->assertInertia(fn (Assert $page) => $page->where('can.update', false));
    $this->get(route('admin.settings.billing.edit'))->assertOk()->assertInertia(fn (Assert $page) => $page->where('canUpdate', false));
    $this->patch(route('admin.tax-rates.update', $tax), ['name' => 'Tax', 'percentage' => '18'])->assertForbidden();
    $this->put(route('admin.settings.billing.update'), billingSettingsPayload())->assertForbidden();
});

test('super-admin can manage settings and tax presets', function () {
    Role::findOrCreate('super-admin', 'web');
    $this->actingAs(User::factory()->create()->assignRole('super-admin'));
    $this->get(route('admin.settings.billing.edit'))->assertOk();
    $this->get(route('admin.tax-rates.index'))->assertOk();
});

test('tax presets accept zero and exact fractional percentages and reject invalid values', function () {
    $this->post(route('admin.tax-rates.store'), ['name' => ' Fractional tax ', 'percentage' => '7.1250'])->assertSessionHasNoErrors()->assertRedirect();
    $tax = TaxRate::sole();
    expect($tax->name)->toBe('Fractional tax')->and($tax->percentage)->toBe('7.1250');
    $this->get(route('admin.tax-rates.edit', $tax))->assertOk()->assertInertia(fn (Assert $page) => $page->component('billing::tax-rates/form')->where('readOnly', false));
    $this->patch(route('admin.tax-rates.update', $tax), ['name' => 'Zero rate', 'percentage' => '0'])->assertSessionHasNoErrors();
    expect($tax->fresh()->percentage)->toBe('0.0000');
    foreach (['-1', '100.0001', '1.12345', '1e1', 'not a percentage'] as $invalid) {
        $this->postJson(route('admin.tax-rates.store'), ['name' => 'Bad rate', 'percentage' => $invalid])->assertUnprocessable()->assertJsonValidationErrors('percentage');
    }
    expect(TaxRate::count())->toBe(1);
    $this->delete('/admin/tax-rates/'.$tax->id)->assertRedirect();
    expect($tax->fresh())->toBeNull();
});

test('tax archives preserve historical service links block edits and can be restored', function () {
    $service = Service::factory()->create();
    $tax     = TaxRate::factory()->create();
    $service->taxRates()->attach($tax);
    foreach (['tax-rates' => $tax] as $prefix => $record) {
        $this->post(route('admin.'.$prefix.'.archive', $record))->assertRedirect();
        expect($record->fresh()->archived_at)->not->toBeNull();
        $this->get(route('admin.'.$prefix.'.show', $record))->assertOk();
        $this->get(route('admin.'.$prefix.'.edit', $record))->assertStatus(409);
        $payload = ['name' => 'Tax', 'percentage' => '10'];
        $this->patch(route('admin.'.$prefix.'.update', $record), $payload)->assertStatus(409);
        $this->post(route('admin.'.$prefix.'.restore', $record))->assertRedirect();
        expect($record->fresh()->archived_at)->toBeNull();
    }
    expect($service->taxRates()->count())->toBe(1);
});

test('tax table supports search and archive filters', function () {
    TaxRate::factory()->create(['name' => 'Active tax']);
    TaxRate::factory()->create(['name' => 'Old tax', 'archived_at' => now()]);
    $table = fn ($params) => TaxRates::make()->setRequest(Request::create('/', 'GET', $params))->toArray();
    expect($table([])['results']['total'])->toBe(1)
        ->and($table(['search'=>'Active'])['results']['total'])->toBe(1)
        ->and($table(['search'=>'Missing'])['results']['total'])->toBe(0);
    $archiveFilter = ['filters' => ['archived_at' => ['enabled' => true, 'clause' => 'equals', 'value' => 'archived']]];
    expect($table($archiveFilter)['results']['total'])->toBe(1);
});

test('full billing access command grants and revokes direct access to implemented areas', function () {
    $user = User::factory()->create();
    $this->artisan('billing:access', ['email' => $user->email])->assertSuccessful();
    expect($user->fresh()->hasAllPermissions(BillingPermissions::ALL))->toBeTrue();
    $this->artisan('billing:access', ['email' => $user->email, '--revoke' => true])->assertSuccessful();
    expect($user->fresh()->can('view', BillingSettings::class))->toBeFalse();
    $this->artisan('billing:access', ['email' => 'missing@example.org'])->assertFailed();
});

test('manual payment methods are configurable without changing existing invoices', function () {
    $this->put(route('admin.settings.billing.update'), billingSettingsPayload(['payment_methods' => ['cash', 'cheque']]))->assertSessionHasNoErrors();
    expect(app(BillingSettings::class)->payment_methods)->toBe(['cash', 'cheque']);
    $this->putJson(route('admin.settings.billing.update'), billingSettingsPayload(['payment_methods' => ['cash', 'cash']]))->assertJsonValidationErrors('payment_methods.0');
    $this->putJson(route('admin.settings.billing.update'), billingSettingsPayload(['payment_methods' => ['gateway']]))->assertJsonValidationErrors('payment_methods.0');
    $this->put(route('admin.settings.billing.update'), billingSettingsPayload(['payment_methods' => []]))->assertSessionHasNoErrors();
    expect(app(BillingSettings::class)->payment_methods)->toBe([]);
});
