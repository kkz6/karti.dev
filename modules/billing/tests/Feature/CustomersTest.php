<?php

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Contact;
use Modules\Billing\Models\Customer;
use Modules\Billing\Support\CustomerPermissions;
use Modules\Billing\Tables\Customers;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
    $this->actingAs($this->admin);
});

function customerPayload(array $overrides = []): array
{
    return array_replace(['type' => 'business', 'display_name' => ' Example Studio ', 'legal_name' => 'Example Studio Ltd', 'billing_country' => 'in', 'default_currency' => 'inr', 'internal_notes' => 'Private billing note'], $overrides);
}

function contactPayload(array $overrides = []): array
{
    return array_replace(['name' => ' Ada Accountant ', 'email' => ' ADA@EXAMPLE.ORG ', 'is_primary' => false, 'invoice_emails' => true], $overrides);
}

test('admin role is provisioned and customer pages are private', function () {
    expect($this->admin->hasAllPermissions(CustomerPermissions::ALL))->toBeTrue();
    $this->get(route('admin.customers.index'))->assertOk()->assertInertia(fn (Assert $page) => $page->component('billing::customers/index')->where('billingAccess.viewCustomers', true));
    $this->get(route('admin.customers.create'))->assertOk();
    auth()->logout();
    $this->get(route('admin.customers.index'))->assertRedirect(route('login'));
});

test('customers can be created edited and viewed without creating administrator accounts', function () {
    $usersBefore = User::count();
    $this->post(route('admin.customers.store'), customerPayload())->assertRedirect();
    $customer = Customer::sole();
    expect($customer->display_name)->toBe('Example Studio')->and($customer->billing_country)->toBe('IN')->and($customer->default_currency)->toBe('INR')->and(User::count())->toBe($usersBefore);
    $this->get(route('admin.customers.show', $customer))->assertOk()->assertInertia(fn (Assert $page) => $page->component('billing::customers/show')->where('customer.internal_notes', 'Private billing note')->has('customer.contacts', 0));
    $this->get(route('admin.customers.edit', $customer))->assertOk();
    $this->patch(route('admin.customers.update', $customer), customerPayload(['type' => 'individual', 'display_name' => 'Ada', 'archived_at' => now()->toIso8601String()]))->assertRedirect(route('admin.customers.show', $customer));
    expect($customer->fresh()->type)->toBe('individual')->and($customer->fresh()->display_name)->toBe('Ada')->and($customer->fresh()->archived_at)->toBeNull();
    $this->delete('/admin/customers/'.$customer->id)->assertStatus(405);
});

test('customer input rejects invalid identity addresses and website schemes', function (array $changes, string $field) {
    $this->post(route('admin.customers.store'), customerPayload($changes))->assertSessionHasErrors($field);
    expect(Customer::count())->toBe(0);
})->with([
    [['display_name' => '   '], 'display_name'],
    [['type' => 'tenant'], 'type'],
    [['billing_country' => 'India'], 'billing_country'],
    [['default_currency' => 'Rupees'], 'default_currency'],
    [['website' => 'javascript:alert(1)'], 'website'],
    [['phone' => str_repeat('1', 51)], 'phone'],
]);

test('users without permission cannot read mutate or export customers', function () {
    $customer = Customer::factory()->create();
    $contact  = Contact::factory()->create(['customer_id' => $customer->id]);
    $this->actingAs(User::factory()->create());
    $this->get(route('admin.customers.index'))->assertForbidden();
    $this->get(route('admin.customers.create'))->assertForbidden();
    $this->get(route('admin.customers.show', $customer))->assertForbidden();
    $this->get(route('admin.customers.edit', $customer))->assertForbidden();
    $this->post(route('admin.customers.store'), customerPayload())->assertForbidden();
    $this->patch(route('admin.customers.update', $customer), customerPayload())->assertForbidden();
    $this->post(route('admin.customers.archive', $customer))->assertForbidden();
    $this->post(route('admin.customers.restore', $customer))->assertForbidden();
    $this->post(route('admin.customers.contacts.store', $customer), contactPayload())->assertForbidden();
    $this->patch(route('admin.customers.contacts.update', [$customer, $contact]), contactPayload())->assertForbidden();
    $this->post(route('admin.customers.contacts.archive', [$customer, $contact]))->assertForbidden();
    $this->post(route('admin.customers.contacts.restore', [$customer, $contact]))->assertForbidden();
    $url = URL::signedRoute('inertia-tables.export', ['table' => base64_encode(Customers::class), 'name' => 'default', 'export' => 0]);
    $this->get($url)->assertForbidden();
    $url = URL::signedRoute('inertia-tables.action', ['table' => base64_encode(Customers::class), 'name' => 'default', 'action' => 0]);
    $this->post($url, ['keys' => [$customer->id]])->assertForbidden();
    expect($customer->fresh()->archived_at)->toBeNull()->and(Contact::count())->toBe(1);
});

test('read-only permissions do not allow customer or contact edits', function () {
    $reader = User::factory()->create();
    $reader->givePermissionTo(['view any customer', 'view customer']);
    $customer = Customer::factory()->create();
    $this->actingAs($reader)->get(route('admin.customers.show', $customer))->assertOk()->assertInertia(fn (Assert $page) => $page->where('can.update', false)->where('can.archive', false)->where('can.restore', false));
    $this->patch(route('admin.customers.update', $customer), customerPayload())->assertForbidden();
    $this->post(route('admin.customers.contacts.store', $customer), contactPayload())->assertForbidden();
});

test('super-admin follows the shared policy bypass', function () {
    Role::findOrCreate('super-admin', 'web');
    $user = User::factory()->create()->assignRole('super-admin');
    $this->actingAs($user)->get(route('admin.customers.index'))->assertOk();
});

test('customer archive preserves contacts and prevents edits until restored', function () {
    $customer = Customer::factory()->create();
    $contact  = Contact::factory()->create(['customer_id' => $customer->id, 'primary_slot' => 1]);
    $this->post(route('admin.customers.archive', $customer))->assertRedirect();
    expect($customer->fresh()->archived_at)->not->toBeNull()->and($contact->fresh()->is_primary)->toBeTrue();
    $this->get(route('admin.customers.show', $customer))->assertOk();
    $this->get(route('admin.customers.edit', $customer))->assertStatus(409);
    $this->patch(route('admin.customers.update', $customer), customerPayload())->assertStatus(409);
    $this->post(route('admin.customers.contacts.store', $customer), contactPayload())->assertStatus(409);
    $this->post(route('admin.customers.contacts.archive', [$customer, $contact]))->assertStatus(409);
    $this->post(route('admin.customers.restore', $customer))->assertRedirect();
    expect($customer->fresh()->archived_at)->toBeNull()->and($customer->contacts()->count())->toBe(1);
    $this->patch(route('admin.customers.update', $customer), customerPayload())->assertRedirect();
});

test('contact changes normalize email and preserve a single primary contact', function () {
    $customer = Customer::factory()->create();
    $this->from(route('admin.customers.show', $customer))->post(route('admin.customers.contacts.store', $customer), contactPayload())->assertRedirect();
    $first = $customer->contacts()->sole();
    expect($first->name)->toBe('Ada Accountant')->and($first->email)->toBe('ada@example.org')->and($first->is_primary)->toBeTrue();
    $this->post(route('admin.customers.contacts.store', $customer), contactPayload(['name' => 'Billing Team', 'is_primary' => true]))->assertRedirect();
    $second = $customer->contacts()->reorder()->latest('id')->first();
    expect($first->fresh()->is_primary)->toBeFalse()->and($second->is_primary)->toBeTrue();
    $this->patch(route('admin.customers.contacts.update', [$customer, $first]), contactPayload(['is_primary' => true, 'invoice_emails' => false]))->assertRedirect();
    expect($second->fresh()->is_primary)->toBeFalse()->and($first->fresh()->is_primary)->toBeTrue()->and($first->fresh()->invoice_emails)->toBeFalse();
    $this->post(route('admin.customers.contacts.archive', [$customer, $first]))->assertRedirect();
    expect($first->fresh()->is_primary)->toBeFalse()->and($first->fresh()->archived_at)->not->toBeNull()->and($second->fresh()->is_primary)->toBeTrue();
    $this->patch(route('admin.customers.contacts.update', [$customer, $first]), contactPayload())->assertStatus(409);
    $this->post(route('admin.customers.contacts.restore', [$customer, $first]))->assertRedirect();
    expect($first->fresh()->archived_at)->toBeNull()->and($first->fresh()->is_primary)->toBeFalse()->and($customer->contacts()->where('primary_slot', 1)->count())->toBe(1);
});

test('restoring the only contact restores the primary designation', function () {
    $customer = Customer::factory()->create();
    $contact  = Contact::factory()->create(['customer_id' => $customer->id, 'primary_slot' => 1]);
    $this->post(route('admin.customers.contacts.archive', [$customer, $contact]))->assertRedirect();
    expect($customer->primaryContact()->first())->toBeNull();
    $this->post(route('admin.customers.contacts.restore', [$customer, $contact]))->assertRedirect();
    expect($contact->fresh()->is_primary)->toBeTrue();
});

test('editing or repeatedly restoring the existing primary does not replace it', function () {
    $customer = Customer::factory()->create();
    Contact::factory()->create(['customer_id' => $customer->id]);
    $primary = Contact::factory()->create(['customer_id' => $customer->id, 'primary_slot' => 1]);
    $this->patch(route('admin.customers.contacts.update', [$customer, $primary]), contactPayload(['is_primary' => true]))->assertRedirect();
    expect($primary->fresh()->is_primary)->toBeTrue();
    $this->post(route('admin.customers.contacts.restore', [$customer, $primary]))->assertRedirect();
    expect($primary->fresh()->is_primary)->toBeTrue();
});

test('same email can belong to contacts at different customers', function () {
    $one = Customer::factory()->create();
    $two = Customer::factory()->create();
    foreach ([$one, $two] as $customer) {
        $this->post(route('admin.customers.contacts.store', $customer), contactPayload())->assertRedirect();
    }
    expect(Contact::where('email', 'ada@example.org')->count())->toBe(2)->and(Customer::count())->toBe(2);
});

test('nested contact routes reject contacts belonging to another customer', function () {
    $one     = Customer::factory()->create();
    $two     = Customer::factory()->create();
    $contact = Contact::factory()->create(['customer_id' => $two->id]);
    $this->patch(route('admin.customers.contacts.update', [$one, $contact]), contactPayload())->assertNotFound();
    $this->post(route('admin.customers.contacts.archive', [$one, $contact]))->assertNotFound();
    $this->post(route('admin.customers.contacts.restore', [$one, $contact]))->assertNotFound();
    expect($contact->fresh()->archived_at)->toBeNull();
});

test('invalid contact input does not demote the existing primary', function () {
    $customer = Customer::factory()->create();
    $primary  = Contact::factory()->create(['customer_id' => $customer->id, 'primary_slot' => 1]);
    $this->post(route('admin.customers.contacts.store', $customer), contactPayload(['email' => 'invalid', 'is_primary' => true]))->assertSessionHasErrors('email');
    expect($primary->fresh()->is_primary)->toBeTrue()->and($customer->contacts()->count())->toBe(1);
});

test('database rejects a second primary contact for the same customer', function () {
    $customer = Customer::factory()->create();
    Contact::factory()->create(['customer_id' => $customer->id, 'primary_slot' => 1]);
    expect(fn () => Contact::factory()->create(['customer_id' => $customer->id, 'primary_slot' => 1]))->toThrow(QueryException::class);
});

test('customer table defaults to active and can search emails and filter archived records', function () {
    $active   = Customer::factory()->create(['display_name' => 'Active business']);
    $archived = Customer::factory()->create(['display_name' => 'Archived person', 'type' => 'individual', 'archived_at' => now()]);
    Contact::factory()->create(['customer_id' => $active->id, 'email' => 'accounts@example.org', 'primary_slot' => 1]);
    $table = fn (array $params) => Customers::make()->setRequest(Request::create('/', 'GET', $params))->toArray();
    $data  = $table([]);
    expect($data['results']['total'])->toBe(1)->and($data['results']['data'][0]['display_name'])->toBe($active->display_name);
    expect($table(['search' => 'accounts@example.org'])['results']['total'])->toBe(1);
    expect($table(['search' => 'missing@example.org'])['results']['total'])->toBe(0);
    $data = $table(['filters' => ['archived_at' => ['enabled' => true, 'clause' => 'equals', 'value' => 'archived']]]);
    expect($data['results']['total'])->toBe(1)->and($data['results']['data'][0]['display_name'])->toBe($archived->display_name);
});

test('customer permission command grants and revokes direct access without creating a user', function () {
    $user = User::factory()->create();
    $this->artisan('billing:customer-access', ['email' => $user->email])->assertSuccessful();
    expect($user->fresh()->can('viewAny', Customer::class))->toBeTrue();
    $this->artisan('billing:customer-access', ['email' => $user->email, '--revoke' => true])->assertSuccessful();
    expect($user->fresh()->can('viewAny', Customer::class))->toBeFalse();
    $this->artisan('billing:customer-access', ['email' => 'missing@example.org'])->assertFailed();
});

test('customer details do not appear in public page props', function () {
    Customer::factory()->create(['internal_notes' => 'Private billing note']);
    auth()->logout();
    $this->get('/contact')->assertOk()->assertInertia(fn (Assert $page) => $page->missing('customer')->missing('customers')->where('billingAccess.viewCustomers', false));
});
