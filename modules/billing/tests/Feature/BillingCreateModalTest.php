<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Models\Customer;
use Modules\Billing\Support\BillingPermissions;

uses(RefreshDatabase::class);
beforeEach(function () {
    $this->actingAs(User::factory()->create()->assignRole('admin')->givePermissionTo(BillingPermissions::ALL));
});
test('creation dialogs receive options through authorized JSON routes', function (string $name) {
    $this->getJson(route($name))->assertOk()->assertHeader('Content-Type', 'application/json');
})->with(['admin.customers.create', 'admin.services.create', 'admin.tax-rates.create', 'admin.recurring-invoices.create']);
test('modal customer service and tax creation returns to their lists', function () {
    $this->withHeaders(['X-Billing-Modal'=>'1'])->post(route('admin.customers.store'), ['type'=>'business', 'display_name'=>'Modal customer', 'default_currency'=>'EUR'])->assertRedirect(route('admin.customers.index'));
    $this->withHeaders(['X-Billing-Modal'=>'1'])->post(route('admin.services.store'), ['name'=>'Modal service', 'unit'=>'item', 'rate'=>'12.50', 'currency'=>'EUR', 'tax_rate_ids'=>[]])->assertRedirect(route('admin.services.index'));
    $this->withHeaders(['X-Billing-Modal'=>'1'])->post(route('admin.tax-rates.store'), ['name'=>'Modal tax', 'percentage'=>'5'])->assertRedirect(route('admin.settings.billing.edit', ['section'=>'taxes']));
});
test('modal validation preserves the form without writing records', function () {
    $this->withHeaders(['X-Billing-Modal'=>'1'])->from(route('admin.customers.index'))->post(route('admin.customers.store'), ['display_name'=>''])->assertSessionHasErrors('display_name');
    expect(Customer::count())->toBe(0);
});
test('the selected invoice is authorized and supplied with the list', function () {
    $customer=Customer::factory()->create();
    $draft   =app(SaveInvoiceDraft::class)->handle(['customer_id'=>$customer->id, 'invoice_date'=>'2026-10-11', 'due_date'=>'2026-11-10', 'currency'=>'INR', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>'00000000-0000-4000-8000-000000000019', 'description'=>'Panel line', 'unit'=>'item', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]]]);
    $this->getJson(route('admin.invoices.show', $draft))->assertOk()->assertJsonPath('draft', true)->assertJsonPath('invoice.id', $draft->id);
    $this->get(route('admin.invoices.index', ['invoice'=>$draft->id]))->assertOk();
    $limited=User::factory()->create()->givePermissionTo('view any invoice');
    $this->actingAs($limited)->get(route('admin.invoices.index', ['invoice'=>$draft->id]))->assertForbidden();
});

test('invoice-panel payment redirects keep the invoice list context and exact balance', function () {
    $settings=app(\Modules\Billing\Settings\BillingSettings::class);
    $settings->fill(['legal_name'=>'Test company', 'address'=>'Company address', 'country'=>'IN', 'payment_methods'=>['bank_transfer']])->save();
    $customer=Customer::factory()->create(['billing_address'=>'Customer address', 'billing_country'=>'IN']);
    $draft   =app(SaveInvoiceDraft::class)->handle(['customer_id'=>$customer->id, 'invoice_date'=>'2026-10-10', 'due_date'=>'2026-11-10', 'currency'=>'INR', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>'00000000-0000-4000-8000-000000000021', 'description'=>'Panel payment test', 'unit'=>'item', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]]]);
    $review  =app(\Modules\Billing\Services\InvoiceIssueReview::class)->prepare($draft, true, false);
    $invoice =app(\Modules\Billing\Actions\IssueInvoice::class)->handle($draft, ['version'=>$draft->version, 'review_token'=>$review['token'], 'refresh_seller'=>true, 'refresh_customer'=>false], auth()->user());
    $this->withHeaders(['X-Billing-Invoice-Panel'=>(string) $invoice->id])->post(route('admin.invoices.payments.store', $invoice), ['version'=>$invoice->version, 'request_key'=>(string) \Illuminate\Support\Str::uuid(), 'amount'=>'25.00', 'currency'=>'INR', 'payment_date'=>'2026-10-11', 'method'=>'bank_transfer'])->assertRedirect(route('admin.invoices.index', ['invoice'=>$invoice->id]));
    expect(app(\Modules\Billing\Services\InvoiceBalance::class)->data($invoice->fresh())['balance'])->toBe('75.00');
});

test('invoice row menus expose draft editing and permission based document actions', function () {
    $customer = Customer::factory()->create();
    $draft    = app(SaveInvoiceDraft::class)->handle(['customer_id'=>$customer->id, 'invoice_date'=>'2026-10-11', 'due_date'=>'2026-11-10', 'currency'=>'INR', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>'00000000-0000-4000-8000-000000000044', 'description'=>'Action visibility', 'unit'=>'item', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]]]);
    $actions  = collect(\Modules\Billing\Tables\Invoices::make()->actions())->keyBy('id');
    expect($actions['invoice-edit']->isHidden($draft))->toBeFalse()
        ->and($actions['invoice-sharing']->isHidden($draft))->toBeTrue()
        ->and($actions['invoice-payments']->isHidden($draft))->toBeTrue();
    $issued         = clone $draft;
    $issued->status = 'issued';
    expect($actions['invoice-edit']->isHidden($issued))->toBeTrue()
        ->and($actions['invoice-sharing']->isHidden($issued))->toBeFalse();
    $reader = User::factory()->create()->givePermissionTo(['view any invoice', 'view invoice']);
    $this->actingAs($reader);
    $restricted = collect(\Modules\Billing\Tables\Invoices::make()->actions())->keyBy('id');
    expect($restricted['invoice-pdf']->isAuthorized())->toBeFalse()
        ->and($restricted['invoice-pdf']->isHidden($draft))->toBeTrue()
        ->and($restricted['invoice-edit']->isAuthorized())->toBeFalse()
        ->and($restricted['invoice-edit']->isHidden($draft))->toBeTrue();
    $this->get(route('admin.invoices.pdf', $draft))->assertForbidden();
});

test('draft edit deep links use the shared modal and preserve list authorization', function () {
    $customer = Customer::factory()->create();
    $draft    = app(SaveInvoiceDraft::class)->handle(['customer_id'=>$customer->id, 'invoice_date'=>'2026-10-11', 'due_date'=>'2026-11-10', 'currency'=>'INR', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>'00000000-0000-4000-8000-000000000045', 'description'=>'Editor deep link', 'unit'=>'item', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]]]);
    $this->get(route('admin.invoices.edit', $draft))->assertRedirect(route('admin.invoices.index', ['edit'=>$draft->id]));
    $this->get(route('admin.invoices.index', ['edit'=>$draft->id, 'invoice'=>$draft->id]))->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page->where('editInvoiceId', $draft->id)->where('selectedInvoice', null));
    $reader = User::factory()->create()->givePermissionTo(['view any invoice', 'view invoice']);
    $this->actingAs($reader)->get(route('admin.invoices.index', ['edit'=>$draft->id]))->assertForbidden();
    $editor = User::factory()->create()->givePermissionTo('update invoice');
    $this->actingAs($editor)->get(route('admin.invoices.edit', $draft))->assertOk()->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page->component('billing::invoices/editor')->where('invoiceId', $draft->id)->missing('table'));
    $this->getJson(route('admin.invoices.edit', $draft))->assertOk()->assertJsonPath('invoice.id', $draft->id);
});
