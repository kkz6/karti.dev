<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;

uses(RefreshDatabase::class);
beforeEach(function () {
    $this->actingAs(User::factory()->create()->assignRole('admin')->givePermissionTo(\Modules\Billing\Support\BillingPermissions::ALL));
});
test('billing listings serialize the shared table configuration', function (string $routeName, string $component, string $prop) {
    $this->get(route($routeName))->assertOk()->assertInertia(fn (Assert $page) => $page->component($component)->has($prop.'.columns')->has($prop.'.results')->has($prop.'.filters')->has($prop.'.state'));
})->with([
    ['admin.credit-notes.index', 'billing::credits/index', 'table'],
    ['admin.recurring-invoices.index', 'billing::recurring/index', 'table'],
    ['admin.billing.reconciliation', 'billing::reconciliation', 'checkoutsTable'],
    ['admin.billing.reconciliation', 'billing::reconciliation', 'eventsTable'],
]);
test('billing settings sections share a single entry route', function (string $section, string $component) {
    $this->get(route('admin.settings.billing.edit', ['section'=>$section]))->assertOk()->assertInertia(fn (Assert $page) =>$page->component($component));
})->with([['company', 'billing::settings'], ['automation', 'billing::automation'], ['online', 'billing::online-settings'], ['imports', 'billing::imports/index'], ['taxes', 'billing::tax-rates/index']]);
test('billing settings rejects unknown sections', function () {
    $this->get(route('admin.settings.billing.edit', ['section'=>'unknown']))->assertNotFound();
});
test('an import-only role can open the billing settings entry without company settings access', function () {
    $user=User::factory()->create()->givePermissionTo('import billing data');
    $this->actingAs($user);
    $this->get(route('admin.settings.billing.edit'))->assertOk()->assertInertia(fn (Assert $page) =>$page->component('billing::imports/index')->has('table.columns'));
    $this->get(route('admin.settings.billing.edit', ['section'=>'online']))->assertForbidden();
});
