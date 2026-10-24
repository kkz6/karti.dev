<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Auth\Models\User;
use Modules\Billing\Jobs\DeliverInvoice;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\InvoiceDelivery;
use Modules\Billing\Settings\BillingSettings;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
    Mail::fake();
    Queue::fake();
    app(BillingSettings::class)->fill(['legal_name' => 'Example Studio', 'address' => 'Supplier street', 'country' => 'IN'])->save();
    $this->customer = Customer::factory()->create(['billing_address' => 'Customer street', 'billing_country' => 'IN']);
    $this->payload  = [
        'customer_id'   => $this->customer->id, 'invoice_date' => '2026-10-20', 'currency' => 'INR',
        'discount_mode' => 'none', 'discount_value' => '0',
        'items'         => [['key' => (string) Str::uuid(), 'description' => 'Project development', 'unit' => 'project', 'quantity' => '1', 'rate' => '100', 'taxes' => []]],
    ];
});

test('editor and review expose the send option only to users with send permission', function (bool $canSend) {
    $user = User::factory()->create()->givePermissionTo(['create invoice', 'view invoice', 'issue invoice', ...($canSend ? ['send invoice'] : [])]);
    $this->actingAs($user);
    $this->getJson(route('admin.invoices.create'))->assertOk()->assertJsonPath('canIssue', true)->assertJsonPath('canSend', $canSend);
    $saved = $this->postJson(route('admin.invoices.store'), $this->payload)->assertOk()->assertJsonPath('canSend', $canSend);
    $this->getJson(route('admin.invoices.issue-review', $saved->json('invoice.id')))->assertOk()->assertJsonPath('canSend', $canSend);
    expect(InvoiceDelivery::count())->toBe(0);
    Queue::assertNothingPushed();
    Mail::assertNothingSent();
})->with([true, false]);

test('saving a draft and issuing without sending never queue delivery, including a repeated issue request', function () {
    $this->actingAs(User::factory()->create()->assignRole('admin'));
    $saved  = $this->postJson(route('admin.invoices.store'), $this->payload)->assertOk()->assertJsonPath('invoice.status', 'draft')->assertJsonPath('invoice.formatted_number', null);
    $id     = $saved->json('invoice.id');
    $review = $this->getJson(route('admin.invoices.issue-review', $id))->assertOk()->assertJsonCount(0, 'review.errors');
    $input  = [
        'version'        => $review->json('review.invoice.version'), 'review_token' => $review->json('review.token'),
        'refresh_seller' => true, 'refresh_customer' => false,
    ];
    $issued = $this->postJson(route('admin.invoices.issue', $id), $input)->assertOk()->assertJsonPath('invoice.status', 'issued');
    $this->postJson(route('admin.invoices.issue', $id), $input)->assertOk()->assertJsonPath('invoice.formatted_number', $issued->json('invoice.formatted_number'));
    expect(Invoice::count())->toBe(1)->and(InvoiceDelivery::count())->toBe(0);
    Queue::assertNothingPushed();
    Mail::assertNothingSent();
});

test('opening the send shortcut does not send until the delivery form is explicitly submitted', function () {
    $this->actingAs(User::factory()->create()->assignRole('admin'));
    $saved  = $this->postJson(route('admin.invoices.store'), $this->payload)->assertOk();
    $id     = $saved->json('invoice.id');
    $review = $this->getJson(route('admin.invoices.issue-review', $id))->assertOk();
    $this->postJson(route('admin.invoices.issue', $id), [
        'version'        => $review->json('review.invoice.version'), 'review_token' => $review->json('review.token'),
        'refresh_seller' => true, 'refresh_customer' => false,
    ])->assertOk();
    $this->getJson(route('admin.invoices.show', ['invoice' => $id, 'tab' => 'send']))->assertOk()->assertJsonPath('canSend', true);
    expect(InvoiceDelivery::count())->toBe(0);
    Queue::assertNothingPushed();
    Mail::assertNothingSent();

    $this->post(route('admin.invoices.send', $id), [
        'request_key' => (string) Str::uuid(), 'recipients' => ['accounts@example.test'],
        'subject'     => 'Project invoice', 'message' => 'Please find your invoice attached.',
    ])->assertSessionHasNoErrors()->assertRedirect();
    expect(InvoiceDelivery::count())->toBe(1);
    Queue::assertPushed(DeliverInvoice::class, 1);
    Mail::assertNothingSent();
});
