<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\IssueInvoice;
use Modules\Billing\Actions\ManageCreditNotes;
use Modules\Billing\Actions\ManagePayments;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Models\CreditNote;
use Modules\Billing\Models\Customer;
use Modules\Billing\Services\CreditBalance;
use Modules\Billing\Services\CustomerStatement;
use Modules\Billing\Services\InvoiceBalance;
use Modules\Billing\Services\InvoiceIssueReview;
use Modules\Billing\Settings\BillingSettings;

uses(RefreshDatabase::class);
beforeEach(function () {
    $this->travelTo(\Carbon\Carbon::parse('2026-10-10 12:00:00', 'UTC'));
    $this->admin=User::factory()->create()->assignRole('admin');
    $this->actingAs($this->admin);
    app(BillingSettings::class)->fill(['legal_name'=>'Issuer', 'address'=>'Street', 'country'=>'IN'])->save();
    $this->customer=Customer::factory()->create(['billing_address'=>'Street', 'billing_country'=>'IN']);
    $this->invoice =app(SaveInvoiceDraft::class)->handle(['customer_id'=>$this->customer->id, 'invoice_date'=>'2026-10-01', 'due_date'=>'2026-10-10', 'currency'=>'INR', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['key'=>(string) Str::uuid(), 'description'=>'Service', 'unit'=>'hour', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[['name'=>'VAT', 'percentage'=>'18']]]]]);
    $review        =app(InvoiceIssueReview::class)->prepare($this->invoice, true, false);
    $this->invoice =app(IssueInvoice::class)->handle($this->invoice, ['version'=>1, 'review_token'=>$review['token'], 'refresh_seller'=>true, 'refresh_customer'=>false], $this->admin);
});
function creditTestIssue(string $amount='50'): CreditNote
{
    $action=app(ManageCreditNotes::class);
    $note  =$action->create(test()->invoice->fresh(), ['amount'=>$amount, 'credit_date'=>'2026-10-10', 'reason'=>'Service adjustment', 'request_key'=>(string) Str::uuid()], test()->admin);
    $review=$action->review($note);

    return $action->issue($note, ['version'=>$note->version, 'review_token'=>$review['token']], test()->admin);
}
test('credit issuance uses its own immutable sequence and proportional tax budgets', function () {
    $note  =creditTestIssue('50');
    $before=$note->only(['formatted_number', 'subtotal_minor', 'taxes', 'seller_snapshot', 'customer_snapshot']);
    $action=app(ManageCreditNotes::class);
    $action->issue($note, ['version'=>1, 'review_token'=>str_repeat('0', 64)], $this->admin);
    expect($note->fresh()->formatted_number)->toBe('CN-000001')->and($note->fresh()->only(array_keys($before)))->toBe($before)->and($note->subtotal_minor + array_sum(array_column($note->taxes, 'amount_minor')))->toBe(5000);
    $second=creditTestIssue('68');
    expect($second->formatted_number)->toBe('CN-000002')->and($note->subtotal_minor + $second->subtotal_minor)->toBe(10000)->and(array_sum(array_column($note->taxes, 'amount_minor')) + array_sum(array_column($second->taxes, 'amount_minor')))->toBe(1800);
    expect(fn () =>creditTestIssue('0.01'))->toThrow(\Illuminate\Validation\ValidationException::class);
});
test('allocations reduce invoice balance once reversals restore it and cannot cross currency or customer', function () {
    $note  =creditTestIssue();
    $action=app(ManageCreditNotes::class);
    $input =['amount'=>'40', 'request_key'=>(string) Str::uuid()];
    $a     =$action->allocate($note, $this->invoice, $input, $this->admin);
    $action->allocate($note, $this->invoice, $input, $this->admin);
    expect(app(InvoiceBalance::class)->data($this->invoice->fresh()))->toMatchArray(['balance'=>'78.00', 'credited'=>'40.00'])->and(app(CreditBalance::class)->data($note->fresh())['available'])->toBe('10.00');
    expect(fn () =>$action->allocate($note, $this->invoice, ['amount'=>'11', 'request_key'=>(string) Str::uuid()], $this->admin))->toThrow(\Illuminate\Validation\ValidationException::class);
    $action->reverseAllocation($a, 'Incorrect allocation', $this->admin);
    $action->reverseAllocation($a, 'Another reason', $this->admin);
    expect(app(InvoiceBalance::class)->data($this->invoice->fresh())['balance'])->toBe('118.00')->and(app(CreditBalance::class)->data($note->fresh())['available'])->toBe('50.00');
    $other=$this->invoice->replicate();
    $other->forceFill(['formatted_number'=>'USD-2', 'sequence_number'=>2, 'currency'=>'USD'])->save();
    expect(fn () =>$action->allocate($note, $other, ['amount'=>'10', 'request_key'=>(string) Str::uuid()], $this->admin))->toThrow(\Illuminate\Validation\ValidationException::class);
});
test('refund records are bounded idempotent reversible and keep cash payments distinct', function () {
    $note  =creditTestIssue();
    $action=app(ManageCreditNotes::class);
    $data  =['amount'=>'20', 'refund_date'=>'2026-10-10', 'method_label'=>'Bank transfer', 'reason'=>'Already refunded', 'reference'=>'DEMO', 'request_key'=>(string) Str::uuid()];
    $refund=$action->refund($note, $data, $this->admin);
    $action->refund($note, $data, $this->admin);
    expect(app(CreditBalance::class)->data($note->fresh()))->toMatchArray(['refunded'=>'20.00', 'available'=>'30.00'])->and(\Modules\Billing\Models\Payment::count())->toBe(0);
    expect(fn () =>$action->refund($note, [...$data, 'amount'=>'31', 'request_key'=>(string) Str::uuid()], $this->admin))->toThrow(\Illuminate\Validation\ValidationException::class);
    expect(fn () =>$action->cancel($note, 'Cancel refunded credit', $this->admin))->toThrow(\Illuminate\Validation\ValidationException::class);
    $action->reverseRefund($refund, 'Wrong record', $this->admin);
    expect(app(CreditBalance::class)->data($note->fresh())['available'])->toBe('50.00');
    $action->cancel($note, 'Correction', $this->admin);
    expect($note->fresh()->formatted_number)->toBe('CN-000001')->and($note->fresh()->status)->toBe('cancelled');
});
test('statement opening closing and credit allocations reconcile without subtracting a credit twice', function () {
    $note=creditTestIssue('50');
    app(ManageCreditNotes::class)->allocate($note, $this->invoice, ['amount'=>'50', 'request_key'=>(string) Str::uuid()], $this->admin);
    app(ManagePayments::class)->record($this->invoice->fresh(), ['version'=>$this->invoice->fresh()->version, 'request_key'=>(string) Str::uuid(), 'amount'=>'68', 'currency'=>'INR', 'payment_date'=>'2026-10-10', 'method'=>'cash'], $this->admin);
    $group=app(CustomerStatement::class)->data($this->customer, '2026-10-10', '2026-10-10')['groups'][0];
    expect($group)->toMatchArray(['opening'=>'118.00', 'closing'=>'0.00', 'credits'=>'118.00'])->and($group['entries'])->toHaveCount(2)->and(app(InvoiceBalance::class)->data($this->invoice->fresh())['state'])->toBe('settled');
    $this->get(route('admin.customers.statement', ['customer'=>$this->customer->id, 'from'=>'2026-10-10', 'to'=>'2026-10-10', 'format'=>'csv']))->assertOk();
    $this->get(route('admin.credit-notes.pdf', $note))->assertOk()->assertHeader('Content-Type', 'application/pdf');
});
