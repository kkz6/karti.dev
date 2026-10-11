<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Modules\Auth\Models\User;
use Modules\Billing\Models\Contact;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\ImportBatch;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\InvoiceActivity;
use Modules\Billing\Models\Payment;
use Modules\Billing\Services\Imports\PerfexBillingImport;
use Modules\Billing\Services\Imports\PerfexImportPlan;

uses(RefreshDatabase::class);

function perfexBillingFixture(): array
{
    return [
        'tbloptions'               => array_map(fn ($name, $value) => compact('name', 'value'), ['default_timezone', 'number_padding_prefixes', 'next_invoice_number', 'invoice_company_name', 'stripe_secret'], ['Asia/Kolkata', '6', '2', 'Example issuer', 'DO-NOT-IMPORT']),
        'tblcountries'             => [['country_id' => '1', 'iso2' => 'IN']],
        'tblcurrencies'            => [['id' => '1', 'name' => 'INR', 'isdefault' => '1']],
        'tblclients'               => [['userid' => '1', 'company' => 'Example customer', 'vat' => '', 'phonenumber' => '', 'website' => '', 'billing_street' => '', 'address' => 'General address', 'billing_city' => '', 'city' => '', 'billing_state' => '', 'state' => '', 'billing_zip' => '', 'zip' => '', 'billing_country' => '0', 'country' => '1', 'default_currency' => '1', 'datecreated' => '2025-01-01 10:00:00', 'active' => '1']],
        'tblcontacts'              => [['id' => '1', 'userid' => '1', 'is_primary' => '1', 'firstname' => 'Example', 'lastname' => 'Contact', 'email' => 'example@example.test', 'phonenumber' => '', 'title' => '', 'datecreated' => '2025-01-01 10:00:00', 'active' => '1', 'invoice_emails' => '1', 'password' => 'DO-NOT-IMPORT', 'new_pass_key' => 'DO-NOT-IMPORT']],
        'tblinvoices'              => [['id' => '1', 'clientid' => '1', 'status' => '2', 'recurring' => '0', 'adjustment' => '0.00', 'currency' => '1', 'number' => '1', 'prefix' => 'OLD-', 'number_format' => '1', 'formatted_number' => null, 'date' => '2025-01-02', 'duedate' => '2025-01-31', 'datecreated' => '2025-01-02 10:00:00', 'subtotal' => '100.00', 'discount_total' => '0.00', 'total_tax' => '0.00', 'total' => '100.00', 'billing_street' => '', 'billing_city' => '', 'billing_state' => '', 'billing_zip' => '', 'billing_country' => '0', 'clientnote' => 'Original note', 'adminnote' => '', 'terms' => 'Original terms', 'hash' => 'DO-NOT-IMPORT', 'token' => 'DO-NOT-IMPORT']],
        'tblitemable'              => [['id' => '1', 'rel_id' => '1', 'rel_type' => 'invoice', 'description' => 'Example work', 'long_description' => "First line\nSecond line", 'qty' => '2', 'rate' => '50.00', 'unit' => 'hour', 'item_order' => '1']],
        'tblinvoicepaymentrecords' => [['id' => '1', 'invoiceid' => '1', 'amount' => '100.00', 'paymentmode' => '1', 'paymentmethod' => '', 'date' => '2025-01-03', 'daterecorded' => '2025-01-03 10:00:00', 'note' => 'Historic transfer', 'transactionid' => 'EXAMPLE-REF']],
        'tblpayment_modes'         => [['id' => '1', 'name' => 'Bank transfer']],
        'tblsales_activity'        => [['id' => '1', 'rel_id' => '1', 'rel_type' => 'invoice', 'description' => 'invoice_activity_created', 'additional_data' => '', 'staffid' => '1', 'full_name' => 'Original actor', 'date' => '2025-01-02 10:00:00']],
        'tblstaff'                 => [['staffid' => '1', 'firstname' => 'Original', 'lastname' => 'Actor', 'password' => 'DO-NOT-IMPORT']],
        'tbltracked_mails'         => [['id' => '1', 'rel_id' => '1', 'rel_type' => 'invoice', 'uid' => 'DO-NOT-IMPORT', 'email' => 'example@example.test', 'opened' => '1']],
        'tblnotes'                 => [['id' => '1', 'rel_id' => '1', 'rel_type' => 'customer', 'description' => 'Historic customer note']],
        'tblsessions'              => [['id' => 'DO-NOT-IMPORT']],
    ];
}

test('Perfex history imports atomically with exact amounts, relations, timestamps and private supplementary records', function () {
    Bus::fake();
    Mail::fake();
    Queue::fake();
    $actor    = User::factory()->create()->assignRole('admin');
    $importer = app(PerfexBillingImport::class);
    $plan     = app(PerfexImportPlan::class)->build(perfexBillingFixture(), 'example');
    expect($importer->review($plan)['errors'])->toBeEmpty()->and(Invoice::count())->toBe(0);
    $batch   = $importer->apply($plan, $actor);
    $invoice = Invoice::firstOrFail();
    expect($invoice->formatted_number)->toBe('OLD-000001')->and($invoice->total_minor)->toBe(10000)
        ->and($invoice->customer_snapshot['billing_address'])->toBe('')->and($invoice->reminders_disabled)->toBeTrue()
        ->and($invoice->created_at->format('Y-m-d H:i:s'))->toBe('2025-01-02 04:30:00')
        ->and($invoice->items()->first()->additional_description)->toBe("First line\nSecond line")
        ->and(Payment::first()->invoice_id)->toBe($invoice->id)->and(Payment::first()->actor_id)->toBeNull()
        ->and(Contact::first()->customer_id)->toBe($invoice->customer_id)->and(Customer::first()->internal_notes)->toContain('Historic customer note')
        ->and(InvoiceActivity::first()->actor_name)->toBe('Original actor');
    expect(json_encode($batch->manifest))->not->toContain('DO-NOT-IMPORT')->and(DB::table('billing_import_batches')->value('manifest'))->not->toContain('Example customer');
    $importer->apply($plan, $actor);
    expect(Invoice::count())->toBe(1)->and(Payment::count())->toBe(1)->and(Contact::count())->toBe(1)->and(ImportBatch::count())->toBe(1);
    expect($importer->review($plan)['counts']['invoice']['existing'])->toBe(1);
    Bus::assertNothingDispatched();
    Mail::assertNothingOutgoing();
    Queue::assertNothingPushed();
});

test('changed source data blocks imports without overwriting records', function () {
    $actor    = User::factory()->create()->assignRole('admin');
    $importer = app(PerfexBillingImport::class);
    $plan     = app(PerfexImportPlan::class)->build(perfexBillingFixture(), 'example');
    $importer->apply($plan, $actor);
    $changed                                  = perfexBillingFixture();
    $changed['tbltracked_mails'][0]['opened'] = '0';
    $changed                                  = app(PerfexImportPlan::class)->build($changed, 'example');
    expect(fn () => $importer->apply($changed, $actor))->toThrow(RuntimeException::class);
    expect(Customer::count())->toBe(1)->and(Invoice::count())->toBe(1)->and(Payment::count())->toBe(1);
});

test('unsupported financial history and mismatched balances are rejected before writes', function (string $case) {
    $tables = perfexBillingFixture();
    match ($case) {
        'total'            => $tables['tblinvoices'][0]['total']               = '101.00',
        'payment'          => $tables['tblinvoicepaymentrecords'][0]['amount'] = '99.00',
        'adjustment'       => $tables['tblinvoices'][0]['adjustment']          = '1.00',
        'recurring'        => $tables['tblinvoices'][0]['recurring']           = '1',
        'credits'          => $tables['tblcreditnotes']                        = [['id' => '1']],
        'missing customer' => $tables['tblinvoices'][0]['clientid']            = '2',
    };
    expect(fn () => app(PerfexImportPlan::class)->build($tables, 'example'))->toThrow(RuntimeException::class);
    expect(Invoice::count())->toBe(0)->and(Customer::count())->toBe(0);
})->with(['total', 'payment', 'adjustment', 'recurring', 'credits', 'missing customer']);

test('duplicate source numbers retain separate payments history routes and PDF identities on reruns', function () {
    $actor                         = User::factory()->create()->assignRole('admin');
    $tables                        = perfexBillingFixture();
    $tables['tblinvoices'][]       = [...$tables['tblinvoices'][0], 'id' => '2', 'status' => '5'];
    $tables['tblitemable'][]       = [...$tables['tblitemable'][0], 'id' => '2', 'rel_id' => '2'];
    $tables['tblsales_activity'][] = [...$tables['tblsales_activity'][0], 'id' => '2', 'rel_id' => '2', 'description' => 'invoice_activity_marked_as_cancelled'];
    $plan                          = app(PerfexImportPlan::class)->build($tables, 'example');
    expect($plan['duplicate_numbers'])->toBe(['OLD-000001' => ['1', '2']]);
    $importer = app(PerfexBillingImport::class);
    $importer->apply($plan, $actor);
    $importer->apply($plan, $actor);
    $paid      = Invoice::where('status', 'issued')->firstOrFail();
    $cancelled = Invoice::where('status', 'cancelled')->firstOrFail();
    expect($paid->formatted_number)->toBe('OLD-000001')->and($cancelled->formatted_number)->toBe('OLD-000001')
        ->and($paid->id)->not->toBe($cancelled->id)->and($paid->payments()->count())->toBe(1)
        ->and($cancelled->payments()->count())->toBe(0)->and($paid->activities()->count())->toBe(1)
        ->and($cancelled->activities()->count())->toBe(1)->and(Invoice::count())->toBe(2);
    $balance = app(\Modules\Billing\Services\InvoiceBalance::class);
    expect($balance->data($paid)['state'])->toBe('paid')->and($balance->data($cancelled)['state'])->toBe('cancelled');
    foreach ([$paid, $cancelled] as $invoice) {
        $this->actingAs($actor)->get(route('admin.invoices.show', $invoice))->assertOk()
            ->assertInertia(fn ($page) => $page->where('invoice.id', $invoice->id)->where('invoice.status', $invoice->status)->where('invoice.formatted_number', 'OLD-000001'));
        $data = app(\Modules\Billing\Services\InvoicePdf::class)->data($invoice, true);
        expect($data['invoice']['id'])->toBe($invoice->id)->and($data['label'])->toBe('OLD-000001');
    }
});

test('a historical number can coexist with an existing native invoice without changing that invoice', function () {
    $actor    = User::factory()->create()->assignRole('admin');
    $importer = app(PerfexBillingImport::class);
    $plan     = app(PerfexImportPlan::class)->build(perfexBillingFixture(), 'example');
    $customer = Customer::factory()->create();
    $native   = new Invoice;
    $native->forceFill([...$plan['records']['invoice'][1]['attributes'], 'number_scope' => 'native', 'customer_id' => $customer->id])->save();
    $before = $native->refresh()->getRawOriginal();
    expect($importer->review($plan)['errors'])->toBeEmpty();
    $importer->apply($plan, $actor);
    expect($native->fresh()->getRawOriginal())->toBe($before)->and(Invoice::where('formatted_number', 'OLD-000001')->count())->toBe(2);
    $nativeDuplicate = $native->replicate();
    expect(fn () => $nativeDuplicate->save())->toThrow(\Illuminate\Database\QueryException::class);
});

test('imported source downloads require billing import permission and do not expose credentials', function () {
    $admin    = User::factory()->create()->assignRole('admin');
    $batch    = app(PerfexBillingImport::class)->apply(app(PerfexImportPlan::class)->build(perfexBillingFixture(), 'example'), $admin);
    $response = $this->actingAs($admin)->get(route('admin.billing.imports.archive', $batch));
    $response->assertOk();
    expect($response->streamedContent())->toContain('destination_mappings', 'Historic customer note')->not->toContain('DO-NOT-IMPORT');
    $this->actingAs(User::factory()->create())->get(route('admin.billing.imports.archive', $batch))->assertForbidden();
});

test('a database failure rolls back customers invoices payments mappings and batches together', function () {
    $actor = User::factory()->create()->assignRole('admin');
    DB::statement("CREATE TRIGGER reject_import_payment BEFORE INSERT ON billing_payments BEGIN SELECT RAISE(ABORT, 'Test payment failure'); END");
    $plan = app(PerfexImportPlan::class)->build(perfexBillingFixture(), 'example');
    expect(fn () => app(PerfexBillingImport::class)->apply($plan, $actor))->toThrow(\Illuminate\Database\QueryException::class);
    expect(Customer::count())->toBe(0)->and(Contact::count())->toBe(0)->and(Invoice::count())->toBe(0)->and(Payment::count())->toBe(0)
        ->and(ImportBatch::count())->toBe(0)->and(DB::table('billing_import_mappings')->count())->toBe(0)
        ->and(DB::table('billing_invoice_sequences')->where('scope', 'invoices')->value('next_number'))->toBe(1);
});

test('source HTML becomes readable native text while the original remains archived', function () {
    $tables                                       = perfexBillingFixture();
    $tables['tblitemable'][0]['long_description'] = 'First &amp; second<br />Another line';
    $plan                                         = app(PerfexImportPlan::class)->build($tables, 'example');
    expect($plan['records']['invoice'][1]['items'][0]['additional_description'])->toBe("First & second\nAnother line")
        ->and($plan['archive']['tblitemable'][0]['long_description'])->toBe('First &amp; second<br />Another line');
});

test('reviewing an imported Perfex batch uses its adapter rather than the generic JSON importer', function () {
    $admin = User::factory()->create()->assignRole('admin');
    $batch = app(PerfexBillingImport::class)->apply(app(PerfexImportPlan::class)->build(perfexBillingFixture(), 'example'), $admin);
    $this->actingAs($admin)->get(route('admin.billing.imports.show', $batch))->assertOk()
        ->assertInertia(fn ($page) => $page->component('billing::imports/show')->where('hasSourceArchive', true)->has('report.errors', 0)->where('report.counts.invoice.existing', 1));
});

test('the command defaults to review and the opt-in seeder imports the same SQL repeatedly', function () {
    $path = tempnam(sys_get_temp_dir(), 'perfex-command-');
    $sql  = '';
    foreach (perfexBillingFixture() as $table => $rows) {
        $sql .= 'CREATE TABLE `'.$table.'` (`id` int);'."\n";
        foreach ($rows as $row) {
            $values = array_map(fn ($value) => $value === null ? 'NULL' : "'".str_replace(['\\', "'", "\n", "\r"], ['\\\\', "\\'", '\\n', '\\r'], $value)."'", array_values($row));
            $sql .= 'INSERT INTO `'.$table.'` (`'.implode('`, `', array_keys($row)).'`) VALUES ('.implode(', ', $values).');'."\n";
        }
    }
    file_put_contents($path, $sql);
    $environment = [];
    try {
        $this->artisan('billing:import-perfex', ['file' => $path, '--source' => 'example-command'])->assertSuccessful();
        expect(Customer::count())->toBe(0)->and(ImportBatch::count())->toBe(0);
        $this->artisan('billing:import-perfex', ['file' => $path, '--source' => 'example-command', '--apply' => true])->assertFailed();
        expect(Customer::count())->toBe(0);
        $actor = User::factory()->create()->assignRole('admin');
        foreach (['PERFEX_SQL_PATH' => $path, 'PERFEX_IMPORT_ACTOR' => $actor->id, 'PERFEX_IMPORT_SOURCE' => 'example-command'] as $name => $value) {
            $environment[$name] = getenv($name);
            putenv($name.'='.$value);
        }
        $this->artisan('db:seed', ['--class' => 'PerfexBillingSeeder', '--force' => true])->assertSuccessful();
        $this->artisan('db:seed', ['--class' => 'PerfexBillingSeeder', '--force' => true])->assertSuccessful();
        expect(Invoice::count())->toBe(1)->and(Payment::count())->toBe(1)->and(ImportBatch::count())->toBe(1);
    } finally {
        unlink($path);
        foreach ($environment as $name => $value) {
            putenv($value === false ? $name : $name.'='.$value);
        }
    }
});

test('missing invoice children stop a replay instead of reporting success', function () {
    $actor    = User::factory()->create()->assignRole('admin');
    $plan     = app(PerfexImportPlan::class)->build(perfexBillingFixture(), 'example');
    $importer = app(PerfexBillingImport::class);
    $importer->apply($plan, $actor);
    Invoice::first()->items()->delete();
    expect($importer->review($plan)['errors'])->not->toBeEmpty();
    expect(fn () => $importer->apply($plan, $actor))->toThrow(RuntimeException::class);
});

test('Japanese yen remains zero-decimal and fractional yen is rejected', function () {
    $tables                             = perfexBillingFixture();
    $tables['tblcurrencies'][0]['name'] = 'JPY';
    $plan                               = app(PerfexImportPlan::class)->build($tables, 'example');
    expect($plan['records']['invoice'][1]['attributes']['total_minor'])->toBe(100)
        ->and($plan['records']['payment'][1]['attributes']['amount_minor'])->toBe(100)
        ->and($plan['totals']['JPY']['paid'])->toBe('100');
    $tables['tblinvoicepaymentrecords'][0]['amount'] = '100.01';
    expect(fn () => app(PerfexImportPlan::class)->build($tables, 'example'))->toThrow(\Brick\Math\Exception\RoundingNecessaryException::class);
});
