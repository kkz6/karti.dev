<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Billing\Models\PaymentMethod;

uses(RefreshDatabase::class);
beforeEach(function () {
    $this->actingAs(User::factory()->create()->assignRole('admin'));
    Storage::fake('local');
});
function customerContextInvoiceData(int $id): array
{
    return ['customer_id'=>$id, 'invoice_date'=>now()->subDay()->format('Y-m-d'), 'currency'=>'USD', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>(string) Str::uuid(), 'description'=>'Service', 'unit'=>'item', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]]];
}

test('customer invoice creation pins the customer and preserves their default currency', function () {
    $customer=Customer::factory()->create(['default_currency'=>'USD']);
    $other   =Customer::factory()->create();
    $this->getJson(route('admin.customers.invoices.create', $customer))->assertOk()->assertJsonPath('lockedCustomer.id', $customer->id)->assertJsonPath('defaults.currency', 'USD')->assertJsonCount(1, 'customers');
    $url=route('admin.customers.invoices.store', $customer);
    $this->postJson($url, customerContextInvoiceData($other->id))->assertJsonValidationErrors('customer_id');
    $this->postJson($url, customerContextInvoiceData($customer->id))->assertOk()->assertJsonPath('invoice.customer_id', $customer->id)->assertJsonPath('lockedCustomer.id', $customer->id);
    expect(Invoice::count())->toBe(1);
    $invoice=Invoice::first();
    $this->getJson(route('admin.customers.invoices.edit', [$other, $invoice]))->assertNotFound();
    $this->patchJson(route('admin.customers.invoices.update', [$customer, $invoice]), [...customerContextInvoiceData($other->id), 'version'=>$invoice->version])->assertJsonValidationErrors('customer_id');
});

test('archived customers and missing permissions cannot create a customer-scoped invoice', function () {
    $customer=Customer::factory()->create(['archived_at'=>now()]);
    $this->getJson(route('admin.customers.invoices.create', $customer))->assertStatus(409);
    $this->actingAs(User::factory()->create())->getJson(route('admin.customers.invoices.create', $customer))->assertForbidden();
});

test('manual payment methods can be added and used while used methods cannot be deleted', function () {
    $this->post(route('admin.billing.payment-methods.store'), ['name'=>'Office bank', 'enabled'=>true])->assertSessionHasNoErrors();
    $method  =PaymentMethod::where('name', 'Office bank')->firstOrFail();
    $customer=Customer::factory()->create();
    $invoice =app(SaveInvoiceDraft::class)->handle(customerContextInvoiceData($customer->id));
    $invoice->forceFill(['status'=>'issued', 'formatted_number'=>'INV-000001'])->save();
    $data=['version'=>$invoice->version, 'request_key'=>(string) Str::uuid(), 'amount'=>'20', 'currency'=>'USD', 'payment_date'=>now()->format('Y-m-d'), 'method'=>$method->code];
    $this->post(route('admin.invoices.payments.store', $invoice), $data)->assertRedirect()->assertSessionHasNoErrors();
    expect(Payment::first()->payment_method_id)->toBe($method->id)->and(Payment::first()->method_label)->toBe('Office bank');
    $this->deleteJson(route('admin.billing.payment-methods.destroy', $method))->assertJsonValidationErrors('payment_method');
    expect(fn () =>DB::table('billing_payment_methods')->where('id', $method->id)->delete())->toThrow(\Illuminate\Database\QueryException::class);
    $this->put(route('admin.billing.payment-methods.update', $method), ['name'=>'Office bank renamed', 'enabled'=>false])->assertSessionHasNoErrors();
    expect(Payment::first()->method_label)->toBe('Office bank');
    $this->postJson(route('admin.invoices.payments.store', $invoice), [...$data, 'version'=>$invoice->fresh()->version, 'request_key'=>(string) Str::uuid()])->assertJsonValidationErrors('method');
    $this->post(route('admin.invoices.payments.store', $invoice), $data)->assertSessionHasNoErrors();
});

test('unused methods can be deleted and management is permission protected', function () {
    $method=PaymentMethod::create(['name'=>'Unused', 'code'=>'unused', 'enabled'=>true, 'manual'=>true]);
    $this->delete(route('admin.billing.payment-methods.destroy', $method))->assertSessionHasNoErrors();
    expect($method->fresh())->toBeNull();
    $this->actingAs(User::factory()->create())->postJson(route('admin.billing.payment-methods.store'), ['name'=>'Forbidden', 'enabled'=>true])->assertForbidden();
});
