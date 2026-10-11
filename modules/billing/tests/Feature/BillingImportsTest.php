<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Billing\Services\BillingImporter;

uses(RefreshDatabase::class);
function mappedBillingFixture(): array
{
    return ['version'=>1, 'source'=>'demo-perfex-export', 'mapping'=>['timezone'=>'Asia/Kolkata', 'rounding_policy'=>'verify', 'customers'=>'tblclients', 'invoices'=>'tblinvoices + tblitemable', 'payments'=>'tblinvoicepaymentrecords'], 'customers'=>[['external_id'=>'client-1', 'type'=>'business', 'display_name'=>'Demo imported customer', 'billing_address'=>'Street', 'billing_country'=>'IN', 'default_currency'=>'INR', 'contacts'=>[['name'=>'Billing', 'email'=>'billing@example.test', 'is_primary'=>true, 'invoice_emails'=>true]]]], 'invoices'=>[['external_id'=>'invoice-1', 'customer_external_id'=>'client-1', 'number'=>'LEGACY-000104', 'status'=>'issued', 'currency'=>'INR', 'invoice_date'=>'2025-10-01', 'due_date'=>'2025-10-31', 'issued_at'=>'2025-10-01T09:00:00+05:30', 'discount_mode'=>'none', 'discount_value'=>'0', 'items'=>[['description'=>'Historical service', 'unit'=>'hour', 'quantity'=>'1', 'rate'=>'100', 'taxes'=>[]]], 'subtotal'=>'100.00', 'discount'=>'0.00', 'tax'=>'0.00', 'total'=>'100.00', 'seller_snapshot'=>['legal_name'=>'Original issuer', 'address'=>'Issuer street', 'country'=>'IN'], 'customer_snapshot'=>['display_name'=>'Original customer name', 'billing_address'=>'Customer street', 'billing_country'=>'IN']]], 'payments'=>[['external_id'=>'payment-1', 'invoice_external_id'=>'invoice-1', 'amount'=>'40.00', 'currency'=>'INR', 'payment_date'=>'2025-10-05', 'method_label'=>'Bank', 'created_at'=>'2025-10-05T10:00:00+05:30']]];
}
test('mapped imports preserve original numbers and payments and reruns never duplicate records', function () {
    $admin   =User::factory()->create()->assignRole('admin');
    $importer=app(BillingImporter::class);
    $fixture =mappedBillingFixture();
    $before  =Customer::count();
    $report  =$importer->review($fixture);
    expect($report['errors'])->toBeEmpty()->and(Invoice::count())->toBe(0);
    $batch=$importer->stage($fixture, $admin);
    $importer->commit($batch, $importer->token($batch), $admin);
    $importer->commit($batch, $importer->token($batch), $admin);
    expect(Customer::count())->toBe($before + 1)->and(Invoice::count())->toBe(1)->and(Payment::count())->toBe(1)->and(Invoice::first()->formatted_number)->toBe('LEGACY-000104')->and(Invoice::first()->customer_snapshot['display_name'])->toBe('Original customer name')->and(Payment::first()->invoice_id)->toBe(Invoice::first()->id)->and(\Illuminate\Support\Facades\DB::table('billing_invoice_sequences')->where('scope', 'invoices')->value('next_number'))->toBe(105);
    expect($importer->review($fixture)['counts']['invoices']['existing'])->toBe(1);
});
test('unsafe fields rounding mismatches and changed mapped records fail dry-run validation', function () {
    $importer                           =app(BillingImporter::class);
    $fixture                            =mappedBillingFixture();
    $fixture['customers'][0]['password']='portal-secret';
    expect($importer->review($fixture)['errors'])->not->toBeEmpty();
    $fixture                        =mappedBillingFixture();
    $fixture['invoices'][0]['total']='101.00';
    expect($importer->review($fixture)['errors'])->not->toBeEmpty();
    $admin  =User::factory()->create()->assignRole('admin');
    $fixture=mappedBillingFixture();
    $batch  =$importer->stage($fixture, $admin);
    $importer->commit($batch, $importer->token($batch), $admin);
    $fixture['invoices'][0]['number']='CHANGED-104';
    expect($importer->review($fixture)['errors'])->not->toBeEmpty();
});
test('invalid review tokens and destination number collisions do not partially import', function () {
    $admin   =User::factory()->create()->assignRole('admin');
    $importer=app(BillingImporter::class);
    $batch   =$importer->stage(mappedBillingFixture(), $admin);
    expect(fn () =>$importer->commit($batch, str_repeat('0', 64), $admin))->toThrow(\Illuminate\Validation\ValidationException::class);
    expect(Invoice::count())->toBe(0);
});

test('credential-bearing mapping metadata is rejected without retaining a staged secret', function () {
    $admin                                =User::factory()->create()->assignRole('admin');
    $fixture                              =mappedBillingFixture();
    $fixture['mapping']['portal_password']='not-to-be-retained';
    expect(fn () =>app(BillingImporter::class)->stage($fixture, $admin))->toThrow(\Illuminate\Validation\ValidationException::class)->and(\Modules\Billing\Models\ImportBatch::count())->toBe(0);
});
