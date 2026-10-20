<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Auth\Models\User;
use Modules\Billing\Settings\BillingSettings;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->actingAs(User::factory()->create()->assignRole('admin'));
});

test('deployment repairs missing signature settings before company and invoice settings are saved', function (array $missing) {
    $settings = app(BillingSettings::class);
    $settings->fill([
        'display_name'               => 'Example studio',
        'legal_name'                 => 'Original issuer',
        'address'                    => 'Existing billing address',
        'country'                    => 'IN',
        'timezone'                   => 'Asia/Kolkata',
        'number_prefix'              => 'STUDIO-',
        'due_days'                   => 45,
        'signature_media_id'         => 123,
        'show_signature_on_invoices' => true,
    ])->save();
    $before = $settings->toArray();

    DB::table('settings')->where('group', 'billing')->whereIn('name', $missing)->delete();
    // Reproduce an upgraded installation whose earlier migrations are already recorded.
    DB::table('migrations')->where('migration', '2026_10_20_020000_backfill_billing_invoice_signature_settings')->delete();
    app()->forgetInstance(BillingSettings::class);

    $this->artisan('migrate', ['--force' => true])->assertSuccessful();

    $this->put(route('admin.settings.billing.update'), [
        'section'    => 'company',
        'legal_name' => 'Updated issuer',
        'timezone'   => 'Asia/Kolkata',
    ])->assertSessionHasNoErrors()->assertRedirect(route('admin.settings.billing.edit', ['section' => 'company']));

    app()->forgetInstance(BillingSettings::class);
    $expected = array_replace($before, array_intersect_key([
        'signature_media_id'         => null,
        'show_signature_on_invoices' => false,
    ], array_flip($missing)), ['legal_name' => 'Updated issuer']);
    expect(app(BillingSettings::class)->toArray())->toBe($expected);

    $this->put(route('admin.settings.billing.update'), [
        'section'        => 'invoices',
        'due_days'       => 14,
        'number_prefix'  => 'STUDIO-',
        'number_padding' => 6,
    ])->assertSessionHasNoErrors()->assertRedirect(route('admin.settings.billing.edit', ['section' => 'invoices']));

    app()->forgetInstance(BillingSettings::class);
    $expected = array_replace($expected, ['due_days' => 14]);
    expect(app(BillingSettings::class)->toArray())->toBe($expected);

    $this->artisan('migrate:rollback', ['--step' => 1, '--force' => true])->assertSuccessful();
    app()->forgetInstance(BillingSettings::class);
    expect(app(BillingSettings::class)->toArray())->toBe($expected);

    $this->artisan('migrate', ['--force' => true])->assertSuccessful();
    app()->forgetInstance(BillingSettings::class);
    expect(app(BillingSettings::class)->toArray())->toBe($expected);
})->with([
    'both signature settings missing'       => [['signature_media_id', 'show_signature_on_invoices']],
    'signature image setting missing'       => [['signature_media_id']],
    'signature visibility setting missing'  => [['show_signature_on_invoices']],
    'existing signature settings preserved' => [[]],
]);
