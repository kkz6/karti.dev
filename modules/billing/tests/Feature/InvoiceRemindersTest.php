<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Jobs\DeliverInvoice;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\InvoiceDelivery;
use Modules\Billing\Settings\BillingAutomationSettings;
use Modules\Settings\Support\EmailConfiguration;

uses(RefreshDatabase::class);
beforeEach(function () {
    $this->travelTo(\Carbon\Carbon::parse('2026-10-10 18:45:00', 'UTC'));
    Queue::fake();
    Mail::fake();
    Storage::fake('local');
    $this->admin=User::factory()->create()->assignRole('admin');
    $this->actingAs($this->admin);
    $customer     =Customer::factory()->create();
    \Modules\Billing\Models\Contact::factory()->create(['customer_id' => $customer->id, 'email' => 'billing@example.test', 'phone' => '+919880952222']);
    $this->invoice=app(SaveInvoiceDraft::class)->handle(['customer_id'=>$customer->id, 'invoice_date'=>'2026-10-01', 'due_date'=>'2026-10-11', 'currency'=>'INR', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>(string) Str::uuid(), 'description'=>'Service', 'unit'=>'hour', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]]]);
    $this->invoice->forceFill(['status'=>'issued', 'formatted_number'=>'INV-000001', 'customer_snapshot'=>[...$this->invoice->customer_snapshot, 'contacts'=>[['name'=>'Billing', 'email'=>'billing@example.test']]]])->save();
    app(BillingAutomationSettings::class)->fill(['reminders_enabled'=>true, 'reminder_offsets'=>[0, 3]])->save();
});
test('business timezone eligibility and repeated reminder commands create one attempt', function () {
    $this->artisan('billing:reminders')->assertSuccessful();
    $this->artisan('billing:reminders')->assertSuccessful();
    expect(InvoiceDelivery::count())->toBe(1)->and(InvoiceDelivery::first()->occurrence_key)->toContain('2026-10-11:0');
});
test('draft cancelled paid and opted out invoices never queue reminders', function (string $state) {
    if ($state === 'paid') {
        $this->invoice->forceFill(['total_minor'=>0])->save();
    } elseif ($state === 'optout') {
        $this->invoice->update(['reminders_disabled'=>true]);
    } else {
        $this->invoice->forceFill(['status'=>$state])->save();
    }
    $this->artisan('billing:reminders')->assertSuccessful();
    expect(InvoiceDelivery::count())->toBe(0);
})->with(['draft', 'cancelled', 'paid', 'optout']);
test('settlement or opt-out after queueing is checked immediately before sending', function (string $change) {
    $this->artisan('billing:reminders')->assertSuccessful();
    $delivery=InvoiceDelivery::first();
    if ($change === 'paid') {
        $this->invoice->forceFill(['total_minor'=>0])->save();
    } elseif ($change === 'optout') {
        $this->invoice->update(['reminders_disabled'=>true]);
    } else {
        app(BillingAutomationSettings::class)->fill(['reminders_enabled'=>false])->save();
    }
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    expect($delivery->fresh()->state)->toBe('skipped');
    Mail::assertNothingSent();
})->with(['paid', 'optout', 'disabled']);

test('partial settlement after queueing skips a stale reminder attachment', function () {
    $this->artisan('billing:reminders')->assertSuccessful();
    $delivery=InvoiceDelivery::first();
    $this->invoice->increment('version');
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    expect($delivery->fresh()->state)->toBe('skipped');
    Mail::assertNothingSent();
});
