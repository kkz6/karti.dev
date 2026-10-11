<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Models\CreditNote;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Services\BillingDashboard;
use Modules\Billing\Settings\BillingSettings;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->travelTo(now('UTC')->setDate(2026, 10, 10)->setTime(19, 0));
    app(BillingSettings::class)->fill(['timezone' => 'Asia/Kolkata'])->save();
});

function dashboardInvoice(string $currency = 'INR', string $status = 'issued', string $due = '2026-10-10'): Invoice
{
    $invoice = app(SaveInvoiceDraft::class)->handle([
        'customer_id'   => Customer::factory()->create()->id,
        'invoice_date'  => '2026-09-01', 'due_date' => $due, 'currency' => $currency,
        'discount_mode' => 'none', 'discount_value' => '0',
        'items'         => [['key' => (string) Str::uuid(), 'description' => 'Work', 'unit' => 'hour', 'quantity' => '1', 'rate' => '100', 'taxes' => []]],
    ]);
    $invoice->forceFill(['status' => $status])->save();

    return $invoice;
}

function dashboardPayment(Invoice $invoice, int $amount, string $date, bool $reversed = false): void
{
    $invoice->payments()->create([
        'request_key'  => (string) Str::uuid(), 'request_hash' => str_repeat('a', 64),
        'amount_minor' => $amount, 'currency' => $invoice->currency, 'currency_precision' => $invoice->currency_precision,
        'payment_date' => $date, 'method' => 'cash', 'method_label' => 'Cash', 'actor_name' => 'Test',
        'created_at'   => now(), 'reversed_at' => $reversed ? now() : null,
    ]);
}

test('billing overview separates currencies and counts only payable issued balances', function () {
    $invoice = dashboardInvoice();
    dashboardPayment($invoice, 3000, '2026-10-11');
    dashboardPayment($invoice, 1000, '2026-10-10', true);
    $credit = CreditNote::forceCreate([
        'invoice_id'  => $invoice->id, 'customer_id' => $invoice->customer_id, 'currency' => 'INR', 'currency_precision' => 2,
        'status'      => 'issued', 'total_minor' => 2000, 'taxes' => [], 'seller_snapshot' => [], 'customer_snapshot' => [],
        'credit_date' => '2026-10-11', 'reason' => 'Adjustment', 'request_key' => (string) Str::uuid(), 'request_hash' => str_repeat('b', 64),
    ]);
    $invoice->creditAllocations()->create(['credit_note_id' => $credit->id, 'amount_minor' => 2000, 'request_key' => (string) Str::uuid(), 'actor_name' => 'Test']);
    $invoice->creditAllocations()->create(['credit_note_id' => $credit->id, 'amount_minor' => 1000, 'request_key' => (string) Str::uuid(), 'actor_name' => 'Test', 'reversed_at' => now()]);
    dashboardInvoice('USD', 'issued', '2026-10-11'); // Due today is not overdue.
    $yen = dashboardInvoice('JPY');
    dashboardPayment($yen, 100, '2026-10-11');
    dashboardInvoice('INR', 'draft');
    dashboardInvoice('INR', 'cancelled');

    $data = app(BillingDashboard::class)->get();
    expect($data['counts'])->toBe(['issued' => 3, 'drafts' => 1, 'outstanding' => 2, 'overdue' => 1]);
    $groups = collect($data['currencies'])->keyBy('currency');
    expect($groups['INR'])->toMatchArray(['invoiced' => '100.00', 'outstanding' => '50.00', 'overdue' => '50.00', 'collected' => '30.00'])
        ->and($groups['USD'])->toMatchArray(['invoiced' => '100.00', 'outstanding' => '100.00', 'overdue' => '0.00', 'collected' => '0.00'])
        ->and($groups['JPY'])->toMatchArray(['invoiced' => '100', 'outstanding' => '0', 'overdue' => '0', 'collected' => '100']);
});

test('collected totals respect billing timezone period bounds and reversed payments', function () {
    $invoice = dashboardInvoice();
    dashboardPayment($invoice, 100, '2026-09-11'); // Outside 30 days.
    dashboardPayment($invoice, 200, '2026-09-12'); // First included day.
    dashboardPayment($invoice, 300, '2026-10-11'); // Today in billing timezone.
    dashboardPayment($invoice, 400, '2026-10-12'); // Future.
    dashboardPayment($invoice, 500, '2026-10-01', true);
    $data = app(BillingDashboard::class)->get();
    expect($data['period'])->toBe(['days' => 30, 'from' => '2026-09-12', 'to' => '2026-10-11', 'timezone' => 'Asia/Kolkata'])
        ->and($data['currencies'][0]['collected'])->toBe('5.00');
});

test('dashboard billing data is permission gated and handles an empty ledger', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->get('/dashboard')->assertOk()->assertInertia(fn (Assert $page) => $page->where('billing', null)->where('canCreateInvoice', false));
    $user->assignRole('admin');
    $this->get('/dashboard')->assertOk()->assertInertia(fn (Assert $page) => $page->has('billing.currencies', 0)->where('billing.counts.issued', 0)->where('canCreateInvoice', true));
});

test('invoice listing summary separates drafts currencies credits and reversed receipts', function () {
    $user = User::factory()->create();
    $user->assignRole('admin');
    $invoice = dashboardInvoice();
    dashboardPayment($invoice, 3000, '2026-10-11');
    dashboardPayment($invoice, 1000, '2026-10-11', true);
    dashboardInvoice('INR', 'draft');
    dashboardInvoice('INR', 'cancelled');
    dashboardInvoice('JPY', 'draft');

    $this->actingAs($user)->get(route('admin.invoices.index', ['view' => 'draft']))->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('summary.currencies', 2)
            ->where('summary.currencies.0.currency', 'INR')
            ->where('summary.currencies.0.invoiced', '100.00')
            ->where('summary.currencies.0.paid', '30.00')
            ->where('summary.currencies.0.outstanding', '70.00')
            ->where('summary.currencies.0.overdue', '70.00')
            ->where('summary.currencies.0.drafts', '100.00')
            ->where('summary.currencies.0.counts.issued', 1)
            ->where('summary.currencies.0.counts.drafts', 1)
            ->where('summary.currencies.1.currency', 'JPY')
            ->where('summary.currencies.1.drafts', '100')
            ->where('summary.currencies.1.invoiced', '0'));

    $this->actingAs(User::factory()->create())->get(route('admin.invoices.index'))->assertForbidden();
});
