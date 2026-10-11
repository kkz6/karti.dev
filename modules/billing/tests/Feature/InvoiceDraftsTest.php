<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Service;
use Modules\Billing\Models\TaxRate;
use Modules\Billing\Settings\BillingSettings;
use Modules\Billing\Tables\Invoices;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->actingAs(User::factory()->create()->assignRole('admin'));
    $this->customer = Customer::factory()->create(['display_name' => 'Original customer', 'billing_address' => 'Original address', 'default_currency' => 'INR']);
});

function invoiceDraftPayload(int $customerId, array $changes = []): array
{
    return array_replace(['customer_id' => $customerId, 'invoice_date' => '2026-10-10', 'due_date' => '2026-11-09', 'currency' => 'INR', 'discount_mode' => 'percent', 'discount_value' => '10', 'customer_note' => 'Customer note', 'internal_note' => 'Private note', 'terms' => 'Due in 30 days', 'payment_instructions' => 'Bank transfer', 'items' => [
        ['key' => '00000000-0000-4000-8000-000000000001', 'service_id' => null, 'description' => 'Consulting', 'unit' => 'hour', 'quantity' => '2', 'rate' => '1000', 'taxes' => [['tax_rate_id' => null, 'name' => 'Example tax', 'percentage' => '18']]],
        ['key' => '00000000-0000-4000-8000-000000000002', 'service_id' => null, 'description' => 'Review', 'unit' => 'item', 'quantity' => '1', 'rate' => '500', 'taxes' => [['tax_rate_id' => null, 'name' => 'Example tax', 'percentage' => '18']]],
    ]], $changes);
}

function createDraftForTest(int $customerId, array $changes = []): Invoice
{
    test()->post(route('admin.invoices.store'), invoiceDraftPayload($customerId, $changes))->assertSessionHasNoErrors()->assertRedirect();

    return Invoice::latest('id')->firstOrFail();
}

test('preview returns exact server totals without writing records', function () {
    $this->postJson(route('admin.invoices.preview'), invoiceDraftPayload($this->customer->id))->assertOk()->assertJsonPath('subtotal', '2500.00')->assertJsonPath('discount', '250.00')->assertJsonPath('tax', '405.00')->assertJsonPath('total', '2655.00');
    expect(Invoice::count())->toBe(0)->and(DB::table('billing_invoice_items')->count())->toBe(0);
});

test('draft save ignores submitted totals numbers lifecycle and snapshots', function () {
    $invoice = createDraftForTest($this->customer->id, ['total_minor' => 1, 'subtotal_minor' => 1, 'formatted_number' => 'INV-000001', 'status' => 'paid', 'seller_snapshot' => ['legal_name' => 'Injected'], 'version' => 999]);
    expect($invoice->status)->toBe('draft')->and($invoice->formatted_number)->toBeNull()->and($invoice->version)->toBe(1)->and($invoice->total_minor)->toBe(265500)->and($invoice->items()->count())->toBe(2)->and($invoice->seller_snapshot['legal_name'])->toBe('');
    $this->get(route('admin.invoices.index'))->assertOk();
    $this->get(route('admin.invoices.show', $invoice))->assertOk()->assertInertia(fn (Assert $page) => $page->component('billing::invoices/show')->where('draft', true)->where('invoice.totals.total', '2655.00')->where('invoice.invoice_date', '2026-10-10')->where('invoice.due_date', '2026-11-09'));
    $this->get(route('admin.invoices.edit', $invoice))->assertRedirect(route('admin.invoices.index', ['edit'=>$invoice->id]));
    $this->delete('/admin/invoices/'.$invoice->id)->assertStatus(405);
});

test('customer issuer service and tax edits preserve copied draft inputs', function () {
    app(BillingSettings::class)->fill(['legal_name' => 'Original issuer'])->save();
    $service                           = Service::factory()->create(['rate' => '1000']);
    $tax                               = TaxRate::factory()->create(['name' => 'Original tax', 'percentage' => '18']);
    $payload                           = invoiceDraftPayload($this->customer->id);
    $payload['items'][0]['service_id'] = $service->id;
    $payload['items'][0]['taxes'][0]   = ['tax_rate_id' => $tax->id, 'name' => $tax->name, 'percentage' => '18'];
    $this->post(route('admin.invoices.store'), $payload)->assertSessionHasNoErrors();
    $invoice = Invoice::sole();
    $this->customer->update(['display_name' => 'New customer', 'billing_address' => 'New address']);
    $service->update(['rate' => '9999', 'currency' => 'USD']);
    $tax->update(['name' => 'New tax', 'percentage' => '20']);
    app(BillingSettings::class)->fill(['legal_name' => 'New issuer'])->save();
    $payload['version'] = 1;
    $this->patch(route('admin.invoices.update', $invoice), $payload)->assertSessionHasNoErrors();
    $invoice->refresh();
    expect($invoice->customer_snapshot['display_name'])->toBe('Original customer')->and($invoice->seller_snapshot['legal_name'])->toBe('Original issuer')->and($invoice->total_minor)->toBe(265500)->and($invoice->items()->first()->rate)->toBe('1000.0000')->and($invoice->items()->first()->taxes()->first()->name)->toBe('Original tax');
    $payload['version']          = 2;
    $payload['refresh_customer'] = true;
    $this->patch(route('admin.invoices.update', $invoice), $payload)->assertSessionHasNoErrors();
    expect($invoice->fresh()->customer_snapshot['display_name'])->toBe('New customer');
});

test('stale edits and previews cannot overwrite a successful update', function () {
    $invoice = createDraftForTest($this->customer->id);
    $payload = invoiceDraftPayload($this->customer->id, ['version' => 1, 'internal_note' => 'First editor']);
    $this->patch(route('admin.invoices.update', $invoice), $payload)->assertSessionHasNoErrors();
    $payload['internal_note'] = 'Stale editor';
    $this->patch(route('admin.invoices.update', $invoice), $payload)->assertSessionHasErrors('version');
    $this->postJson(route('admin.invoices.draft-preview', $invoice), $payload)->assertUnprocessable()->assertJsonValidationErrors('version');
    expect($invoice->fresh()->version)->toBe(2)->and($invoice->fresh()->internal_note)->toBe('First editor')->and($invoice->items()->count())->toBe(2);
});

test('line order survives reopening without changing total', function () {
    $invoice          = createDraftForTest($this->customer->id);
    $payload          = invoiceDraftPayload($this->customer->id, ['version' => 1]);
    $payload['items'] = array_reverse($payload['items']);
    $this->patch(route('admin.invoices.update', $invoice), $payload)->assertSessionHasNoErrors();
    expect($invoice->items()->pluck('description')->all())->toBe(['Review', 'Consulting'])->and($invoice->fresh()->total_minor)->toBe(265500);
});

test('new drafts reject archived references and service currency mismatch', function () {
    $service                           = Service::factory()->create(['currency' => 'USD']);
    $payload                           = invoiceDraftPayload($this->customer->id);
    $payload['items'][0]['service_id'] = $service->id;
    $this->post(route('admin.invoices.store'), $payload)->assertSessionHasErrors('items.0.service_id');
    $service->forceFill(['currency' => 'INR', 'archived_at' => now()])->save();
    $this->post(route('admin.invoices.store'), $payload)->assertSessionHasErrors('items.0.service_id');
    $payload['items'][0]['service_id']              = null;
    $tax                                            = TaxRate::factory()->create(['archived_at' => now()]);
    $payload['items'][0]['taxes'][0]['tax_rate_id'] = $tax->id;
    $this->post(route('admin.invoices.store'), $payload)->assertSessionHasErrors('items.0.taxes.0.tax_rate_id');
    $this->customer->forceFill(['archived_at' => now()])->save();
    $this->post(route('admin.invoices.store'), invoiceDraftPayload($this->customer->id))->assertSessionHasErrors('customer_id');
    expect(Invoice::count())->toBe(0);
});

test('existing drafts retain archived references but cannot reuse them on new lines', function () {
    $service                                        = Service::factory()->create();
    $tax                                            = TaxRate::factory()->create();
    $payload                                        = invoiceDraftPayload($this->customer->id);
    $payload['items'][0]['service_id']              = $service->id;
    $payload['items'][0]['taxes'][0]['tax_rate_id'] = $tax->id;
    $this->post(route('admin.invoices.store'), $payload)->assertSessionHasNoErrors();
    $invoice = Invoice::sole();
    foreach ([$service, $tax, $this->customer] as $record) {
        $record->forceFill(['archived_at' => now()])->save();
    }
    $payload['version'] = 1;
    $this->patch(route('admin.invoices.update', $invoice), $payload)->assertSessionHasNoErrors();
    $payload['version']         = 2;
    $payload['items'][0]['key'] = '00000000-0000-4000-8000-000000000003';
    $this->patch(route('admin.invoices.update', $invoice), $payload)->assertSessionHasErrors('items.0.service_id');
    expect($invoice->fresh()->version)->toBe(2);
});

test('invoice validation rejects invalid inputs before persistence', function (string $field, mixed $value) {
    $payload = invoiceDraftPayload($this->customer->id);
    data_set($payload, $field, $value);
    $this->postJson(route('admin.invoices.store'), $payload)->assertUnprocessable()->assertJsonValidationErrors($field);
    expect(Invoice::count())->toBe(0);
})->with([
    ['items.0.quantity', '0'], ['items.0.quantity', '-1'], ['items.0.quantity', '1.12345'], ['items.0.quantity', '1000000'],
    ['items.0.rate', '1e3'], ['items.0.rate', 1000.25], ['items.0.rate', '-0.01'], ['items.0.key', 'invalid-key'],
    ['currency', 'ZZZ'], ['due_date', '2026-10-09'], ['invoice_date', '2026-02-30'], ['discount_value', '101'],
    ['items.0.taxes.0.percentage', '100.0001'], ['items.0.description', ''],
]);

test('failed calculation rolls back an existing draft update', function () {
    $invoice = createDraftForTest($this->customer->id);
    $this->patch(route('admin.invoices.update', $invoice), invoiceDraftPayload($this->customer->id, ['version' => 1, 'discount_mode' => 'fixed', 'discount_value' => '99999']))->assertSessionHasErrors('discount_value');
    expect($invoice->fresh()->version)->toBe(1)->and($invoice->items()->count())->toBe(2)->and($invoice->total_minor)->toBe(265500);
});

test('invoice routes preview lookup and signed table endpoints enforce access', function () {
    $invoice = createDraftForTest($this->customer->id);
    $this->actingAs(User::factory()->create());
    foreach (['index' => [], 'create' => [], 'show' => [$invoice], 'edit' => [$invoice]] as $action => $params) {
        $this->get(route('admin.invoices.'.$action, $params))->assertForbidden();
    }
    $this->post(route('admin.invoices.store'), invoiceDraftPayload($this->customer->id))->assertForbidden();
    $this->patch(route('admin.invoices.update', $invoice), invoiceDraftPayload($this->customer->id, ['version' => 1]))->assertForbidden();
    $this->postJson(route('admin.invoices.preview'), invoiceDraftPayload($this->customer->id))->assertForbidden();
    $this->getJson(route('admin.invoices.customer-options'))->assertForbidden();
    $this->get(URL::signedRoute('inertia-tables.export', ['table' => base64_encode(Invoices::class), 'name' => 'default', 'export' => 0]))->assertForbidden();
    $this->post(URL::signedRoute('inertia-tables.action', ['table' => base64_encode(Invoices::class), 'name' => 'default', 'action' => 0]), ['keys' => [$invoice->id]])->assertForbidden();
    auth()->logout();
    $this->get('/contact')->assertOk()->assertInertia(fn (Assert $page) => $page->missing('invoice')->missing('invoices')->where('billingAccess.viewInvoices', false));
});

test('read only access cannot edit or preview an editable draft', function () {
    $invoice = createDraftForTest($this->customer->id);
    Customer::factory()->create(['display_name' => 'Unrelated customer']);
    TaxRate::factory()->create(['name' => 'Unrelated tax']);
    app(BillingSettings::class)->fill(['payment_instructions' => 'New private instructions'])->save();
    $reader  = User::factory()->create()->givePermissionTo(['view any invoice', 'view invoice']);
    $this->actingAs($reader)->get(route('admin.invoices.show', $invoice))->assertOk()->assertInertia(fn (Assert $page) => $page->component('billing::invoices/show')->where('canUpdate', false)->missing('customers')->missing('taxRates')->where('invoice.payment_instructions', 'Bank transfer'));
    $this->get(route('admin.invoices.edit', $invoice))->assertForbidden();
    $this->postJson(route('admin.invoices.draft-preview', $invoice), invoiceDraftPayload($this->customer->id, ['version' => 1]))->assertForbidden();
});

test('only draft lifecycle is editable and payment input is required', function () {
    $invoice = createDraftForTest($this->customer->id);
    $invoice->forceFill(['status' => 'issued'])->save();
    $this->get(route('admin.invoices.edit', $invoice))->assertStatus(409);
    $this->patch(route('admin.invoices.update', $invoice), invoiceDraftPayload($this->customer->id, ['version' => 1]))->assertStatus(409);
    $this->post('/admin/invoices/'.$invoice->id.'/issue')->assertSessionHasErrors('review_token');
    $this->post('/admin/invoices/'.$invoice->id.'/payments')->assertSessionHasErrors(['version', 'request_key', 'amount']);
});

test('customer options omit archived customers and private notes', function () {
    Customer::factory()->create(['display_name' => 'Archived', 'archived_at' => now()]);
    $this->getJson(route('admin.invoices.customer-options', ['search' => 'Original']))->assertOk()->assertJsonCount(1, 'customers')->assertJsonMissingPath('customers.0.internal_notes')->assertJsonMissingPath('customers.0.tax_identifier');
});

test('invoice table shows IDs and sorts by creation time with an ID tie breaker', function () {
    $older = createDraftForTest($this->customer->id);
    $older->forceFill(['created_at' => '2025-01-01 10:00:00'])->save();
    $newer = createDraftForTest($this->customer->id);
    $newer->forceFill(['created_at' => '2026-01-01 10:00:00'])->save();
    $imported = createDraftForTest($this->customer->id);
    $imported->forceFill(['created_at' => '2020-01-01 10:00:00'])->save();
    $sameTime = createDraftForTest($this->customer->id);
    $sameTime->forceFill(['created_at' => '2026-01-01 10:00:00'])->save();
    $table = fn (array $query = []) => Invoices::make()->setRequest(\Illuminate\Http\Request::create('/', 'GET', $query))->toArray();
    $data  = $table();
    expect($data['columns'][0]['attribute'])->toBe('id')
        ->and(array_column($data['results']['data'], 'id'))->toBe([$sameTime->id, $newer->id, $older->id, $imported->id])
        ->and(array_column($table(['sort' => 'id'])['results']['data'], 'id'))->toBe([$older->id, $newer->id, $imported->id, $sameTime->id]);
});

test('invoice table customer links point to the related customer independently of invoice preview', function () {
    $invoice = createDraftForTest($this->customer->id);
    $row = Invoices::make()->toArray()['results']['data'][0];
    expect($row['_column_urls']['customer_name'])->toBe(route('admin.customers.show', $this->customer->id))
        ->and($row['_column_urls']['formatted_number'])->toBe(route('admin.invoices.index', ['invoice'=>$invoice->id]));
});
