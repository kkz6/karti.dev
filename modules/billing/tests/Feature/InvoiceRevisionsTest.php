<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\IssueInvoice;
use Modules\Billing\Actions\ManagePayments;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Payment;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Services\InvoiceIssueReview;
use Modules\Billing\Services\InvoicePresentation;
use Modules\Billing\Settings\BillingSettings;

uses(RefreshDatabase::class);

beforeEach(function () {
    Queue::fake();
    Mail::fake();
    $this->admin = User::factory()->create()->assignRole('admin');
    $this->actingAs($this->admin);
    app(BillingSettings::class)->fill(['legal_name' => 'Issuer', 'address' => 'Street', 'country' => 'IN'])->save();
    $this->customer = Customer::factory()->create(['billing_address' => 'Street', 'billing_country' => 'IN']);
    $draft          = app(SaveInvoiceDraft::class)->handle(['customer_id' => $this->customer->id, 'invoice_date' => now()->subDays(5)->format('Y-m-d'), 'due_date' => now()->format('Y-m-d'), 'currency' => 'INR', 'discount_mode' => 'none', 'discount_value' => '0', 'items' => [['key' => (string) Str::uuid(), 'description' => 'Development', 'quantity' => '1', 'unit' => 'project', 'rate' => '100', 'taxes' => []]]]);
    $review         = app(InvoiceIssueReview::class)->prepare($draft, true, false);
    $this->invoice  = app(IssueInvoice::class)->handle($draft, ['version' => $draft->version, 'review_token' => $review['token'], 'refresh_seller' => true, 'refresh_customer' => false], $this->admin);
    app(ManagePayments::class)->record($this->invoice, ['version' => $this->invoice->version, 'request_key' => (string) Str::uuid(), 'amount' => '100', 'currency' => 'INR', 'payment_date' => now()->format('Y-m-d'), 'method' => 'cash', 'send_receipt' => false], $this->admin);
    $this->invoice->refresh();
    $this->input = app(InvoicePresentation::class)->data($this->invoice);
});

test('paid invoice items and billing details can change with audit history and unchanged payments', function () {
    $number                           = $this->invoice->formatted_number;
    $payment                          = Payment::first()->getAttributes();
    $input                            = $this->input;
    $input['items'][0]['description'] = 'Development and maintenance';
    $input['billing_details']         = ['customer' => ['display_name' => 'Corrected customer', 'billing_address' => 'Corrected street', 'billing_country' => 'IN'], 'seller' => ['legal_name' => 'Corrected issuer', 'address' => 'New office', 'country' => 'IN']];
    $this->getJson(route('admin.invoices.edit', $this->invoice))->assertOk()->assertJsonPath('canIssue', false);
    $this->patchJson(route('admin.invoices.update', $this->invoice), $input)->assertOk()->assertJsonPath('invoice.status', 'issued')->assertJsonPath('invoice.formatted_number', $number)->assertJsonPath('invoice.customer_snapshot.billing_address', 'Corrected street')->assertJsonPath('invoice.seller_snapshot.legal_name', 'Corrected issuer');
    $invoice = $this->invoice->fresh();
    expect(app(InvoiceBalance::class)->data($invoice)['state'])->toBe('paid')->and(Payment::first()->getAttributes())->toBe($payment);
    $changes = $invoice->activities()->where('event', 'invoice_updated')->firstOrFail()->changes;
    expect($changes['before']['items'][0]['description'])->toBe('Development')->and($changes['after']['items'][0]['description'])->toBe('Development and maintenance');
    Queue::assertNothingPushed();
    Mail::assertNothingSent();
});

test('raising the invoice total preserves payment and exposes the remaining balance', function () {
    $input                     = $this->input;
    $input['items'][0]['rate'] = '150';
    $this->patchJson(route('admin.invoices.update', $this->invoice), $input)->assertOk()->assertJsonPath('invoice.totals.total', '150.00');
    expect(app(InvoiceBalance::class)->data($this->invoice->fresh()))->toMatchArray(['paid' => '100.00', 'balance' => '50.00', 'state' => 'partial']);
});

test('paid invoice revision rejects invalid financial changes atomically', function (string $change, string $field) {
    $input = $this->input;
    match ($change) {
        'total'    => $input['items'][0]['rate']  = '50',
        'currency' => $input['currency']          = 'USD',
        'stale'    => $input['version']           = 1,
        'date'     => $input['invoice_date']      = now()->addDay()->format('Y-m-d'),
    };
    if ($change === 'date') {
        $input['due_date'] = $input['invoice_date'];
    }
    $this->patchJson(route('admin.invoices.update', $this->invoice), $input)->assertUnprocessable()->assertJsonValidationErrors($field);
    expect($this->invoice->fresh()->total_minor)->toBe(10000)->and(Payment::count())->toBe(1)->and($this->invoice->activities()->where('event', 'invoice_updated')->count())->toBe(0);
})->with([['total', 'items'], ['currency', 'currency'], ['stale', 'version'], ['date', 'invoice_date']]);

test('revision requires update permission and cancelled invoices stay locked', function () {
    $this->actingAs(User::factory()->create()->givePermissionTo('view invoice'));
    $this->patchJson(route('admin.invoices.update', $this->invoice), $this->input)->assertForbidden();
    $this->actingAs($this->admin);
    $this->invoice->forceFill(['status' => 'cancelled'])->save();
    $this->getJson(route('admin.invoices.edit', $this->invoice))->assertStatus(409);
    $this->patchJson(route('admin.invoices.update', $this->invoice), $this->input)->assertStatus(409);
});

test('revision skips queued attachments and waits for deliveries already sending', function (string $state) {
    \Illuminate\Support\Facades\Storage::fake('local');
    $delivery = app(\Modules\Billing\Actions\QueueInvoiceDelivery::class)->handle($this->invoice, ['request_key'=>(string) Str::uuid(), 'recipients'=>['reviewer@example.test'], 'subject'=>'Original invoice', 'message'=>'Test'], $this->admin);
    $delivery->update(['state'=>$state]);
    $input                     = $this->input;
    $input['items'][0]['rate'] = '150';
    $response                  = $this->patchJson(route('admin.invoices.update', $this->invoice), $input);
    if ($state === 'sending') {
        $response->assertUnprocessable()->assertJsonValidationErrors('invoice');
        expect($this->invoice->fresh()->total_minor)->toBe(10000);
    } else {
        $response->assertOk();
        expect($delivery->fresh()->state)->toBe('skipped');
        (new \Modules\Billing\Jobs\DeliverInvoice($delivery->id))->handle(app(\Modules\Settings\Support\EmailConfiguration::class));
        Mail::assertNothingSent();
        expect(app(\Modules\Billing\Services\InvoicePdf::class)->data($this->invoice->fresh())['invoice']['totals']['total'])->toBe('150.00');
    }
})->with(['queued', 'sending']);

test('confirmed currency correction preserves numeric payments transaction details and paid status', function (string $currency, int $minor) {
    $payment = Payment::firstOrFail();
    $payment->update(['reference' => 'Wise-123', 'notes' => 'Original payment']);
    $original = $payment->getAttributes();
    $input    = [...$this->input, 'currency' => $currency, 'correct_payment_currency' => true];
    $this->patchJson(route('admin.invoices.update', $this->invoice), $input)
        ->assertOk()->assertJsonPath('invoice.currency', $currency)->assertJsonPath('hasPayments', true);
    $payment->refresh();
    expect($payment->currency)->toBe($currency)->and($payment->amount_minor)->toBe($minor)
        ->and($payment->reference)->toBe('Wise-123')->and($payment->notes)->toBe('Original payment')
        ->and($payment->request_key)->toBe($original['request_key'])->and($payment->request_hash)->toBe($original['request_hash'])
        ->and(app(InvoiceBalance::class)->data($this->invoice->fresh())['state'])->toBe('paid');
    $audit = $this->invoice->activities()->where('event', 'invoice_updated')->firstOrFail()->changes;
    expect($audit['payments'][0]['before']['currency'])->toBe('INR')->and($audit['payments'][0]['after']['currency'])->toBe($currency);
    expect($this->invoice->activities()->where('event', 'payment_currency_corrected')->exists())->toBeTrue();
    Mail::assertNothingSent();
    Queue::assertNothingPushed();
})->with([['USD', 10000], ['JPY', 100]]);

test('currency corrections cannot round payments or change provider charges', function (string $case) {
    $payment = Payment::firstOrFail();
    if ($case === 'precision') {
        $payment->update(['amount_minor' => 10025]);
    } else {
        $payment->update(['provider' => 'dodo', 'provider_payment_id' => 'provider-original']);
    }
    $original = $payment->getAttributes();
    $this->patchJson(route('admin.invoices.update', $this->invoice), [...$this->input, 'currency' => $case === 'precision' ? 'JPY' : 'USD', 'correct_payment_currency' => true])
        ->assertUnprocessable()->assertJsonValidationErrors('currency');
    expect($payment->fresh()->getAttributes())->toBe($original)->and($this->invoice->fresh()->currency)->toBe('INR');
})->with(['precision', 'provider']);

test('payment currency correction requires payment permission and rolls back with invalid totals', function (string $case) {
    if ($case === 'permission') {
        $this->actingAs(User::factory()->create()->givePermissionTo(['view invoice', 'update invoice']));
    }
    $input = [...$this->input, 'currency' => 'USD', 'correct_payment_currency' => true];
    if ($case === 'total') {
        $input['items'][0]['rate'] = '50';
    }
    $response = $this->patchJson(route('admin.invoices.update', $this->invoice), $input);
    $case === 'permission' ? $response->assertForbidden() : $response->assertUnprocessable()->assertJsonValidationErrors('items');
    expect(Payment::first()->currency)->toBe('INR')->and($this->invoice->fresh()->currency)->toBe('INR');
})->with(['permission', 'total']);

test('issued invoice accepts an optional unit without requiring seller fields again', function () {
    $seller                    = $this->invoice->seller_snapshot;
    $input                     = $this->input;
    $input['items'][0]['unit'] = '';
    $input['billing_details']  = ['customer' => [], 'seller' => []];
    $this->postJson(route('admin.invoices.draft-preview', $this->invoice), $input)->assertOk();
    $this->patchJson(route('admin.invoices.update', $this->invoice), $input)->assertOk()
        ->assertJsonPath('invoice.items.0.unit', '')->assertJsonPath('invoice.seller_snapshot', $seller);
});

test('item validation uses readable field names', function () {
    $input                     = $this->input;
    $input['items'][0]['rate'] = '';
    $this->patchJson(route('admin.invoices.update', $this->invoice), $input)->assertUnprocessable()
        ->assertJson(['errors' => ['items.0.rate' => ['Enter a unit price.']]]);
});

test('pending online checkout prevents a currency correction', function () {
    \Modules\Billing\Models\OnlineCheckout::create(['invoice_id' => $this->invoice->id, 'public_id' => (string) Str::uuid(), 'request_key' => (string) Str::uuid(), 'expected_minor' => 10000, 'currency' => 'INR', 'state' => 'pending', 'invoice_url' => 'https://example.test/invoice']);
    $this->patchJson(route('admin.invoices.update', $this->invoice), [...$this->input, 'currency' => 'USD', 'correct_payment_currency' => true])
        ->assertUnprocessable()->assertJsonValidationErrors('currency');
    expect(Payment::first()->currency)->toBe('INR')->and($this->invoice->fresh()->currency)->toBe('INR');
});
