<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\ManagePayments;
use Modules\Billing\Actions\QueueInvoiceDelivery;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Jobs\DeliverInvoice;
use Modules\Billing\Jobs\QueuePaymentReceipt;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\InvoiceDelivery;
use Modules\Billing\Services\InvoiceNotifications;
use Modules\Billing\Settings\BillingAutomationSettings;
use Modules\Billing\Settings\BillingDeliverySettings;
use Modules\Settings\Support\EmailConfiguration;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->travelTo(\Carbon\Carbon::parse('2026-10-11 12:00:00', 'UTC'));
    Storage::fake('local');
    Queue::fake();
    Mail::fake();
    config(['inertia.ssr.enabled' => false]);
    Http::preventStrayRequests();
    $this->admin = User::factory()->create()->assignRole('admin');
    $this->actingAs($this->admin);
    app(BillingDeliverySettings::class)->fill(['sms_enabled' => true, 'twilio_account_sid' => 'AC'.str_repeat('a', 32), 'twilio_auth_token' => 'private-token', 'twilio_from' => '+14155552671'])->save();
    $customer = Customer::factory()->create();
    \Modules\Billing\Models\Contact::factory()->create(['customer_id' => $customer->id, 'email' => 'billing@example.test', 'phone' => '+919880952222']);
    $this->invoice = app(SaveInvoiceDraft::class)->handle(['customer_id' => $customer->id, 'invoice_date' => '2026-10-10', 'due_date' => '2026-10-11', 'currency' => 'INR', 'discount_mode' => 'none', 'discount_value' => '0', 'items' => [['key' => (string) Str::uuid(), 'description' => 'Service', 'unit' => 'hour', 'quantity' => '2', 'rate' => '100', 'taxes' => []]]]);
    $this->invoice->forceFill(['status' => 'issued', 'formatted_number' => 'INV-000001', 'customer_snapshot' => [...$this->invoice->customer_snapshot, 'contacts' => [['name' => 'Billing', 'email' => 'billing@example.test', 'phone' => '+919880952222']]]])->save();
    $this->sms = ['channel' => 'sms', 'request_key' => (string) Str::uuid(), 'recipients' => ['+91 98809 52222'], 'subject' => 'Invoice INV-000001', 'message' => 'Invoice {invoice_number}: {currency} {amount_due}. {invoice_link}'];
});

function billingDeliveryPayload(array $overrides = []): array
{
    return [...app(BillingDeliverySettings::class)->toArray(), 'twilio_auth_token' => '', 'clear_twilio_auth_token' => false, 'msg91_auth_key' => '', 'clear_msg91_auth_key' => false, ...$overrides];
}

test('SMS settings are permission protected and never expose saved credentials', function () {
    $url = route('admin.settings.billing.edit', ['section' => 'delivery']);
    $this->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page->component('billing::delivery-settings')->missing('settings.twilio_auth_token')->missing('settings.msg91_auth_key')->where('credentials.twilio', true));
    $this->actingAs(User::factory()->create())->get($url)->assertForbidden();
    $this->putJson(route('admin.billing.delivery.update'), billingDeliveryPayload())->assertForbidden();
    $this->postJson(route('admin.billing.delivery.test'), ['recipient' => '+919880952222'])->assertForbidden();
    Http::assertNothingSent();
});

test('SMS credentials are encrypted and blank secrets preserve the saved value', function () {
    $this->put(route('admin.billing.delivery.update'), billingDeliveryPayload())->assertSessionHasNoErrors();
    expect(app(BillingDeliverySettings::class)->twilio_auth_token)->toBe('private-token');
    expect(DB::table('settings')->where('group', 'billing_delivery')->where('name', 'twilio_auth_token')->value('payload'))->not->toContain('private-token');
    $this->putJson(route('admin.billing.delivery.update'), billingDeliveryPayload(['clear_twilio_auth_token' => true]))->assertJsonValidationErrors('twilio_auth_token');
    $this->put(route('admin.billing.delivery.update'), billingDeliveryPayload(['sms_enabled' => false, 'clear_twilio_auth_token' => true]))->assertSessionHasNoErrors();
    expect(app(BillingDeliverySettings::class)->twilio_auth_token)->toBe('');
});

test('Twilio queues a private link and one attempt per request without generating a PDF', function () {
    Http::fake(['api.twilio.com/*' => Http::response(['sid' => 'SM'.str_repeat('b', 32), 'status' => 'queued'], 201)]);
    $url = route('admin.invoices.send', $this->invoice);
    $this->post($url, $this->sms)->assertSessionHasNoErrors();
    $this->post($url, $this->sms)->assertSessionHasNoErrors();
    expect(InvoiceDelivery::count())->toBe(1);
    $delivery = InvoiceDelivery::firstOrFail();
    expect($delivery->channel)->toBe('sms')->and($delivery->pdf_path)->toBe('')->and($delivery->message)->toContain('INR 200.00')->toContain($delivery->invoice_url);
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    Http::assertSentCount(1);
    Http::assertSent(fn ($request) => $request['To'] === '+919880952222' && $request['From'] === '+14155552671' && str_contains($request['Body'], $delivery->invoice_url));
    expect($delivery->fresh()->state)->toBe('sent')->and($delivery->fresh()->provider_reference)->toBe('SM'.str_repeat('b', 32));
    Mail::assertNothingSent();
});

test('MSG91 uses approved template IDs and a snapshotted variable mapping', function () {
    $settings             = app(BillingDeliverySettings::class);
    $templates            = $settings->msg91_templates;
    $templates['invoice'] = ['id' => 'approved-invoice', 'variables' => ['VAR1' => 'invoice_number', 'VAR2' => 'amount_due', 'VAR3' => 'invoice_link']];
    $settings->fill(['sms_provider' => 'msg91', 'msg91_auth_key' => 'msg-private-key', 'msg91_templates' => $templates])->save();
    Http::fake(['control.msg91.com/*' => Http::response(['type' => 'success', 'message' => 'request-123'])]);
    $delivery                   = app(QueueInvoiceDelivery::class)->handle($this->invoice, $this->sms, $this->admin);
    $templates['invoice']['id'] = 'changed-template';
    $settings->fill(['msg91_templates' => $templates, 'sms_provider' => 'twilio'])->save();
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    Http::assertSent(fn ($request) => $request->hasHeader('authkey', 'msg-private-key') && $request['template_id'] === 'approved-invoice' && $request['recipients'][0]['mobiles'] === '919880952222' && $request['recipients'][0]['VAR1'] === 'INV-000001' && $request['recipients'][0]['VAR2'] === '200.00' && $request['recipients'][0]['VAR3'] === $delivery->invoice_url);
    expect($delivery->fresh()->provider)->toBe('msg91')->and($delivery->fresh()->provider_reference)->toBe('request-123');
    expect(DB::table('billing_invoice_deliveries')->value('provider_payload'))->not->toContain($delivery->invoice_url);
});

test('provider rejections and timeouts never cause blind resend attempts', function (bool $timeout) {
    Http::fake(['api.twilio.com/*' => $timeout ? Http::failedConnection() : Http::response(['code' => 21211, 'message' => 'private-token'], 400)]);
    $delivery = app(QueueInvoiceDelivery::class)->handle($this->invoice, $this->sms, $this->admin);
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    expect($delivery->fresh()->state)->toBe($timeout ? 'uncertain' : 'failed')->and($delivery->fresh()->error)->not->toContain('private-token');
    Http::assertSentCount(1);
})->with([false, true]);

test('invalid SMS recipients disabled providers and reused keys are rejected', function () {
    $url = route('admin.invoices.send', $this->invoice);
    $this->postJson($url, [...$this->sms, 'recipients' => ['9880952222']])->assertJsonValidationErrors('recipients.0');
    $this->post($url, $this->sms)->assertSessionHasNoErrors();
    $this->postJson($url, [...$this->sms, 'message' => 'Changed'])->assertJsonValidationErrors('request_key');
    app(BillingDeliverySettings::class)->fill(['sms_enabled' => false])->save();
    $this->postJson($url, [...$this->sms, 'request_key' => (string) Str::uuid()])->assertJsonValidationErrors('channel');
    Http::assertNothingSent();
});

test('reminders queue email and individual SMS attempts once including pre-due notices', function () {
    $this->invoice->update(['due_date' => '2026-10-14']);
    app(BillingAutomationSettings::class)->fill(['reminders_enabled' => true, 'reminder_sms' => true, 'reminder_offsets' => [-3, 0, 3]])->save();
    $this->artisan('billing:reminders')->assertSuccessful();
    $this->artisan('billing:reminders')->assertSuccessful();
    expect(InvoiceDelivery::count())->toBe(2)->and(InvoiceDelivery::where('channel', 'sms')->first()->occurrence_key)->toContain('2026-10-14:-3:sms:');
    $delivery = InvoiceDelivery::where('channel', 'sms')->first();
    app(BillingAutomationSettings::class)->fill(['reminder_sms' => false])->save();
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    expect($delivery->fresh()->state)->toBe('skipped');
    Http::assertNothingSent();
});

test('new payments queue receipts once and reversed payments are not sent', function () {
    app(BillingAutomationSettings::class)->fill(['receipt_email' => true, 'receipt_sms' => true])->save();
    $input   = ['version' => $this->invoice->version, 'request_key' => (string) Str::uuid(), 'amount' => '50.00', 'currency' => 'INR', 'payment_date' => '2026-10-11', 'method' => 'bank_transfer'];
    $payment = app(ManagePayments::class)->record($this->invoice, $input, $this->admin);
    app(ManagePayments::class)->record($this->invoice, $input, $this->admin);
    Queue::assertPushed(QueuePaymentReceipt::class, 1);
    $job = new QueuePaymentReceipt($payment->id);
    $job->handle(app(InvoiceNotifications::class));
    $job->handle(app(InvoiceNotifications::class));
    expect(InvoiceDelivery::count())->toBe(2);
    $delivery = InvoiceDelivery::where('channel', 'sms')->firstOrFail();
    expect($delivery->message)->toContain('INR 50.00')->toContain('150.00');
    $payment->update(['reversed_at' => now()]);
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    expect($delivery->fresh()->state)->toBe('skipped');
    Http::assertNothingSent();
});

test('test SMS uses saved credentials and masked errors', function () {
    Http::fake(['api.twilio.com/*' => Http::response(['sid' => 'SM'.str_repeat('c', 32), 'status' => 'queued'], 201)]);
    $this->postJson(route('admin.billing.delivery.test'), ['recipient' => '+919880952222'])->assertOk()->assertJsonPath('message', 'Test SMS accepted by the provider.');
    $this->postJson(route('admin.billing.delivery.test'), ['recipient' => 'invalid'])->assertJsonValidationErrors('recipient');
    Http::assertSentCount(1);
});

test('automatic notices respect active billing contact preferences when queued and before sending', function () {
    $contact = \Modules\Billing\Models\Contact::where('customer_id', $this->invoice->customer_id)->firstOrFail();
    app(BillingAutomationSettings::class)->fill(['reminders_enabled' => true, 'reminder_sms' => true, 'reminder_offsets' => [0]])->save();
    $contact->update(['invoice_emails' => false]);
    $this->artisan('billing:reminders')->assertSuccessful();
    expect(InvoiceDelivery::count())->toBe(0);
    $contact->update(['invoice_emails' => true]);
    $this->artisan('billing:reminders')->assertSuccessful();
    expect(InvoiceDelivery::count())->toBe(2);
    $contact->forceFill(['archived_at' => now()])->save();
    foreach (InvoiceDelivery::all() as $delivery) {
        (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
        expect($delivery->fresh()->state)->toBe('skipped');
    }
    Http::assertNothingSent();
    Mail::assertNothingSent();
});

test('invalid provider mappings and unknown template fields cannot be saved', function () {
    $payload                                            = billingDeliveryPayload();
    $payload['msg91_templates']['invoice']['variables'] = ['mobiles' => 'invoice_number'];
    $this->putJson(route('admin.billing.delivery.update'), $payload)->assertJsonValidationErrors('msg91_templates');
    $payload                                        = billingDeliveryPayload();
    $payload['templates']['invoice']['sms_message'] = '{unknown_secret}';
    $this->putJson(route('admin.billing.delivery.update'), $payload)->assertJsonValidationErrors('templates.invoice.sms_message');
});

test('MSG91 automatic channels require approved templates for their events', function () {
    $settings                   = app(BillingDeliverySettings::class);
    $templates                  = $settings->msg91_templates;
    $templates['invoice']['id'] = 'invoice-template';
    $settings->fill(['sms_provider' => 'msg91', 'msg91_auth_key' => 'private-key', 'msg91_templates' => $templates])->save();
    $payload = [...app(BillingAutomationSettings::class)->toArray(), 'reminders_enabled' => true, 'reminder_sms' => true];
    $this->putJson(route('admin.billing.automation.update'), $payload)->assertJsonValidationErrors('reminder_sms');
    $templates['due']['id']     = 'due-template';
    $templates['overdue']['id'] = 'overdue-template';
    $settings->fill(['msg91_templates' => $templates])->save();
    $this->put(route('admin.billing.automation.update'), $payload)->assertSessionHasNoErrors();
    expect(app(BillingAutomationSettings::class)->reminder_sms)->toBeTrue();
    Http::assertNothingSent();
});

test('worker interruption during SMS sending records an uncertain outcome instead of a resendable failure', function () {
    $delivery = app(QueueInvoiceDelivery::class)->handle($this->invoice, $this->sms, $this->admin);
    $delivery->update(['state' => 'sending', 'started_at' => now()]);
    (new DeliverInvoice($delivery->id))->failed(new RuntimeException('Worker stopped'));
    (new DeliverInvoice($delivery->id))->handle(app(EmailConfiguration::class));
    expect($delivery->fresh()->state)->toBe('uncertain');
    Http::assertNothingSent();
});
