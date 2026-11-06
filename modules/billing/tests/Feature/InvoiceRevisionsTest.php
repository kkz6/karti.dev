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
