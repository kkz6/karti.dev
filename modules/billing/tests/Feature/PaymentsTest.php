<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\IssueInvoice;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Payment;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Services\InvoiceIssueReview;
use Modules\Billing\Settings\BillingSettings;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create()->assignRole('admin');
    $this->actingAs($this->admin);
    app(BillingSettings::class)->fill(['legal_name' => 'Issuer', 'address' => 'Street', 'country' => 'IN'])->save();
    $this->customer = Customer::factory()->create(['billing_address' => 'Street', 'billing_country' => 'IN']);
    $this->invoice  = app(SaveInvoiceDraft::class)->handle([
        'customer_id' => $this->customer->id, 'invoice_date' => now()->subDays(10)->format('Y-m-d'), 'due_date' => now()->subDays(1)->format('Y-m-d'), 'currency' => 'INR', 'discount_mode' => 'none', 'discount_value' => '0',
        'items'       => [['key' => (string) Str::uuid(), 'description' => 'Consulting', 'unit' => 'hour', 'quantity' => '1', 'rate' => '100', 'taxes' => []]],
    ]);
    $review        = app(InvoiceIssueReview::class)->prepare($this->invoice, true, false);
    $this->invoice = app(IssueInvoice::class)->handle($this->invoice, ['version' => $this->invoice->version, 'review_token' => $review['token'], 'refresh_seller' => true, 'refresh_customer' => false], $this->admin);
    $this->input   = ['version' => $this->invoice->version, 'request_key' => (string) Str::uuid(), 'amount' => '40.00', 'currency' => 'INR', 'payment_date' => now()->format('Y-m-d'), 'method' => 'cash', 'reference' => 'TEST-1', 'notes' => 'Test payment'];
});

test('partial full and reversed payments derive balances without changing issued totals', function () {
    $original = $this->invoice->only(['status', 'total_minor', 'customer_snapshot', 'seller_snapshot', 'formatted_number']);
    $this->post(route('admin.invoices.payments.store', $this->invoice), $this->input)->assertSessionHasNoErrors();
    $invoice = $this->invoice->fresh();
    expect(app(InvoiceBalance::class)->data($invoice))->toMatchArray(['state' => 'partial', 'paid' => '40.00', 'balance' => '60.00', 'overdue' => true]);
    $this->get(route('admin.invoices.show', $invoice))->assertInertia(fn (Assert $page) => $page->where('canCancel', false)->where('settlement.balance', '60.00')->has('payments', 1));
    $second = [...$this->input, 'request_key' => (string) Str::uuid(), 'version' => $invoice->version, 'amount' => '60'];
    $this->post(route('admin.invoices.payments.store', $invoice), $second)->assertSessionHasNoErrors();
    $invoice->refresh();
    expect(app(InvoiceBalance::class)->data($invoice))->toMatchArray(['state' => 'paid', 'balance' => '0.00', 'overdue' => false, 'can_receive' => false]);
    $payment = Payment::latest('id')->first();
    $reverse = ['version' => $invoice->version, 'reason' => 'Incorrect payment entry'];
    $this->post(route('admin.payments.reverse', $payment), $reverse)->assertSessionHasNoErrors();
    $this->post(route('admin.payments.reverse', $payment), $reverse)->assertSessionHasNoErrors();
    $invoice->refresh();
    expect(app(InvoiceBalance::class)->data($invoice)['balance'])->toBe('60.00')->and($invoice->only(array_keys($original)))->toBe($original)->and($payment->fresh()->reversed_by_name)->toBe($this->admin->name)->and($invoice->activities()->where('event', 'payment_reversed')->count())->toBe(1);
});

test('idempotency preserves one payment across retries and rejects changed payloads', function () {
    $url = route('admin.invoices.payments.store', $this->invoice);
    $this->post($url, $this->input)->assertSessionHasNoErrors();
    $this->post($url, [...$this->input, 'amount' => '40.0'])->assertSessionHasNoErrors();
    $this->postJson($url, [...$this->input, 'amount' => '41'])->assertUnprocessable()->assertJsonValidationErrors('request_key');
    expect(Payment::count())->toBe(1)->and($this->invoice->fresh()->version)->toBe(3)->and($this->invoice->activities()->where('event', 'payment_recorded')->count())->toBe(1);
    $payment = Payment::first();
    $this->post(route('admin.payments.reverse', $payment), ['version' => 3, 'reason' => 'Mistaken record'])->assertSessionHasNoErrors();
    $this->post($url, $this->input)->assertSessionHasNoErrors();
    expect(Payment::count())->toBe(1)->and(app(InvoiceBalance::class)->data($this->invoice->fresh())['balance'])->toBe('100.00');
});

test('invalid payment inputs leave balances and audit untouched', function (array $changes, string $field) {
    $this->postJson(route('admin.invoices.payments.store', $this->invoice), [...$this->input, ...$changes])->assertUnprocessable()->assertJsonValidationErrors($field);
    expect(Payment::count())->toBe(0)->and($this->invoice->fresh()->version)->toBe(2)->and(app(InvoiceBalance::class)->data($this->invoice->fresh())['balance'])->toBe('100.00');
})->with([
    'zero'      => [['amount' => '0'], 'amount'], 'negative' => [['amount' => '-1'], 'amount'], 'numeric payload' => [['amount' => 40], 'amount'], 'exponent' => [['amount' => '1e1'], 'amount'],
    'precision' => [['amount' => '0.001'], 'amount'], 'excess' => [['amount' => '100.01'], 'amount'], 'range' => [['amount' => '99999999999999999999999'], 'amount'],
    'currency'  => [['currency' => 'USD'], 'currency'], 'date' => [['payment_date' => '2026-02-30'], 'payment_date'], 'future' => [['payment_date' => '2099-01-01'], 'payment_date'], 'before invoice' => [['payment_date' => '2000-01-01'], 'payment_date'],
    'method'    => [['method' => 'card_gateway'], 'method'], 'key' => [['request_key' => 'invalid'], 'request_key'], 'stale' => [['version' => 1], 'version'],
]);

test('disabled methods block new entries while historic methods and idempotent retries remain', function () {
    $this->post(route('admin.invoices.payments.store', $this->invoice), $this->input)->assertSessionHasNoErrors();
    app(BillingSettings::class)->fill(['payment_methods' => []])->save();
    $this->post(route('admin.invoices.payments.store', $this->invoice), $this->input)->assertSessionHasNoErrors();
    $this->postJson(route('admin.invoices.payments.store', $this->invoice), [...$this->input, 'version' => 3, 'request_key' => (string) Str::uuid()])->assertJsonValidationErrors('method');
    expect(Payment::first()->method_label)->toBe('Cash');
});

test('drafts and cancelled invoices cannot receive money', function (string $status) {
    $this->invoice->forceFill(['status' => $status])->save();
    $this->postJson(route('admin.invoices.payments.store', $this->invoice), $this->input)->assertStatus(409);
    expect(Payment::count())->toBe(0);
})->with(['draft', 'cancelled']);

test('stale second payment and stale reversal cannot overwrite changed balances', function () {
    $this->post(route('admin.invoices.payments.store', $this->invoice), $this->input)->assertSessionHasNoErrors();
    $this->postJson(route('admin.invoices.payments.store', $this->invoice), [...$this->input, 'amount' => '70', 'request_key' => (string) Str::uuid()])->assertJsonValidationErrors('version');
    $payment = Payment::first();
    $this->postJson(route('admin.payments.reverse', $payment), ['version' => 2, 'reason' => 'Stale change'])->assertJsonValidationErrors('version');
    $this->postJson(route('admin.payments.reverse', $payment), ['version' => 3, 'reason' => ' '])->assertJsonValidationErrors('reason');
    expect($payment->fresh()->reversed_at)->toBeNull()->and(Payment::count())->toBe(1);
});

test('currency separated customer totals include archived receivables and exclude drafts cancellations and reversals', function () {
    $this->post(route('admin.invoices.payments.store', $this->invoice), $this->input)->assertSessionHasNoErrors();
    $usd = $this->invoice->replicate();
    $usd->forceFill(['formatted_number' => 'USD-2', 'sequence_number' => 2, 'currency' => 'USD', 'total_minor' => 2500])->save();
    $draft = $this->invoice->replicate();
    $draft->forceFill(['formatted_number' => null, 'sequence_number' => null, 'status' => 'draft'])->save();
    $cancelled = $this->invoice->replicate();
    $cancelled->forceFill(['formatted_number' => 'CANCEL-3', 'sequence_number' => 3, 'status' => 'cancelled'])->save();
    $this->customer->forceFill(['archived_at' => now()])->save();
    $data   = app(InvoiceBalance::class)->customerData($this->customer->id, true);
    $totals = collect($data['totals'])->keyBy('currency');
    expect($totals['INR'])->toMatchArray(['invoiced' => '100.00', 'paid' => '40.00', 'balance' => '60.00'])->and($totals['USD'])->toMatchArray(['invoiced' => '25.00', 'paid' => '0.00', 'balance' => '25.00'])->and($data['invoices'])->toHaveCount(4)->and($data['payments'])->toHaveCount(1);
    $this->get(route('admin.customers.show', $this->customer))->assertInertia(fn (Assert $page) => $page->has('financials.totals', 2));
    // Customer archive does not prevent collecting a previously issued invoice.
    $this->post(route('admin.invoices.payments.store', $this->invoice), [...$this->input, 'version' => 3, 'request_key' => (string) Str::uuid(), 'amount' => '60'])->assertSessionHasNoErrors();
});

test('separate permissions prevent payment entry reversal and financial disclosure', function () {
    $this->post(route('admin.invoices.payments.store', $this->invoice), $this->input)->assertSessionHasNoErrors();
    $payment = Payment::first();
    $reader  = User::factory()->create();
    $reader->givePermissionTo(['view invoice', 'view customer']);
    $this->actingAs($reader);
    $this->postJson(route('admin.invoices.payments.store', $this->invoice), [...$this->input, 'version' => 3, 'request_key' => (string) Str::uuid()])->assertForbidden();
    $this->postJson(route('admin.payments.reverse', $payment), ['version' => 3, 'reason' => 'Not authorized'])->assertForbidden();
    $this->get(route('admin.invoices.show', $this->invoice))->assertInertia(fn (Assert $page) => $page->where('payments', null)->where('canRecordPayment', false)->where('settlement.paid', '40.00')->has('activities', 2));
    $this->get(route('admin.customers.show', $this->customer))->assertInertia(fn (Assert $page) => $page->where('financials', null));
    $reader->givePermissionTo(['record payment', 'view payment']);
    $this->post(route('admin.invoices.payments.store', $this->invoice), [...$this->input, 'version' => 3, 'request_key' => (string) Str::uuid(), 'amount' => '10'])->assertSessionHasNoErrors();
    $this->postJson(route('admin.payments.reverse', $payment), ['version' => 4, 'reason' => 'Not authorized'])->assertForbidden();
});

test('zero total and zero decimal invoices settle exactly without floating point', function () {
    $this->invoice->forceFill(['total_minor' => 0])->save();
    expect(app(InvoiceBalance::class)->data($this->invoice->fresh())['state'])->toBe('paid');
    $this->invoice->forceFill(['total_minor' => 100, 'currency' => 'JPY', 'currency_precision' => 0])->save();
    $this->postJson(route('admin.invoices.payments.store', $this->invoice), [...$this->input, 'amount' => '1.5', 'currency' => 'JPY'])->assertJsonValidationErrors('amount');
    $this->post(route('admin.invoices.payments.store', $this->invoice), [...$this->input, 'amount' => '100', 'currency' => 'JPY'])->assertSessionHasNoErrors();
    expect(app(InvoiceBalance::class)->data($this->invoice->fresh()))->toMatchArray(['state' => 'paid', 'paid' => '100', 'balance' => '0']);
});

test('payments list supports search and requires both list and detail access', function () {
    $this->post(route('admin.invoices.payments.store', $this->invoice), $this->input)->assertSessionHasNoErrors();
    $this->get(route('admin.payments.index', ['search' => 'TEST-1']))->assertOk()->assertInertia(fn (Assert $page) => $page->component('billing::payments/index'));
    $reader = User::factory()->create()->givePermissionTo('view any payment');
    $this->actingAs($reader)->get(route('admin.payments.index'))->assertForbidden();
    $reader->givePermissionTo('view payment');
    $this->get(route('admin.payments.index'))->assertOk();
});

test('payment and grouped totals above javascript safe integers remain exact strings', function () {
    $this->invoice->forceFill(['total_minor' => 99999999999999999])->save();
    $this->post(route('admin.invoices.payments.store', $this->invoice), [...$this->input, 'amount' => '90071992547409.93'])->assertSessionHasNoErrors();
    expect(app(InvoiceBalance::class)->data($this->invoice->fresh()))->toMatchArray(['paid' => '90071992547409.93', 'balance' => '909928007452590.06']);
    $totals = app(InvoiceBalance::class)->customerData($this->customer->id, true)['totals'][0];
    expect($totals)->toMatchArray(['invoiced' => '999999999999999.99', 'paid' => '90071992547409.93', 'balance' => '909928007452590.06']);
});

test('idempotency keys cannot be reused on another invoice', function () {
    $this->post(route('admin.invoices.payments.store', $this->invoice), $this->input)->assertSessionHasNoErrors();
    $other = $this->invoice->replicate();
    $other->forceFill(['formatted_number' => 'OTHER-2', 'sequence_number' => 2])->save();
    $this->postJson(route('admin.invoices.payments.store', $other), [...$this->input, 'version' => $other->version])->assertJsonValidationErrors('request_key');
    expect(Payment::count())->toBe(1)->and(app(InvoiceBalance::class)->data($other)['balance'])->toBe('100.00');
});

test('payment table links the invoice and customer to their own records', function () {
    $this->post(route('admin.invoices.payments.store', $this->invoice), $this->input)->assertSessionHasNoErrors();
    $row = \Modules\Billing\Tables\Payments::make()->toArray()['results']['data'][0];
    expect($row['_column_urls']['invoice.formatted_number'])->toBe(route('admin.invoices.show', $this->invoice->id))
        ->and($row['_column_urls']['invoice.customer_name'])->toBe(route('admin.customers.show', $this->customer->id));
});
