<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Payment;
use Modules\Billing\Models\PaymentMethod;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Support\PaymentMethods;

uses(RefreshDatabase::class);

test('manual payments preserve method codes through the supported storage limit', function (string $code) {
    $this->actingAs(User::factory()->create()->assignRole('admin'));
    Mail::fake();
    Queue::fake();
    $method = PaymentMethod::create(['name' => 'Wise transfer', 'code' => $code, 'enabled' => true, 'manual' => true]);
    PaymentMethods::syncEnabled();
    $customer = Customer::factory()->create();
    $invoice  = app(SaveInvoiceDraft::class)->handle([
        'customer_id' => $customer->id, 'invoice_date' => now()->subDay()->format('Y-m-d'), 'currency' => 'INR', 'discount_mode' => 'none', 'discount_value' => '0',
        'items'       => [['key' => (string) Str::uuid(), 'description' => 'Development', 'unit' => 'project', 'quantity' => '1', 'rate' => '100', 'taxes' => []]],
    ]);
    $invoice->forceFill(['status' => 'issued', 'formatted_number' => 'INV-TEST-1'])->save();
    $input = ['version' => $invoice->version, 'request_key' => (string) Str::uuid(), 'amount' => '100.00', 'currency' => 'INR', 'payment_date' => now()->format('Y-m-d'), 'method' => $code, 'reference' => 'WISE-TEST-1', 'notes' => 'Historical transfer', 'send_receipt' => false];
    $this->post(route('admin.invoices.payments.store', $invoice), $input)->assertRedirect()->assertSessionHasNoErrors();
    $this->post(route('admin.invoices.payments.store', $invoice), $input)->assertRedirect()->assertSessionHasNoErrors();

    $payment = Payment::sole();
    expect($payment->method)->toBe($code)
        ->and($payment->payment_method_id)->toBe($method->id)
        ->and($payment->method_label)->toBe('Wise transfer')
        ->and($payment->reference)->toBe('WISE-TEST-1')
        ->and($payment->notes)->toBe('Historical transfer')
        ->and(app(InvoiceBalance::class)->data($invoice->fresh()))->toMatchArray(['state' => 'paid', 'balance' => '0.00']);
    Queue::assertNothingPushed();
    Mail::assertNothingSent();
})->with([
    'generated custom method' => ['manual_00000000-0000-4000-8000-000000000001'],
    'imported method code'    => ['imported_'.str_repeat('a', 32)],
    'maximum method code'     => [str_repeat('m', 100)],
]);
