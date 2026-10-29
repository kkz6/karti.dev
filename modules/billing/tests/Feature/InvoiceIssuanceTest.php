<?php

use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Models\Customer;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Services\InvoiceIssueReview;
use Modules\Billing\Settings\BillingSettings;
use Modules\Media\Models\Media;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->admin = User::factory()->create()->assignRole('admin');
    $this->actingAs($this->admin);
    app(BillingSettings::class)->fill(['legal_name' => 'Example Issuer', 'address' => 'Issuer street', 'country' => 'IN'])->save();
    $this->customer = Customer::factory()->create(['display_name' => 'Example Customer', 'billing_address' => 'Customer street', 'billing_country' => 'IN']);
    $this->invoice  = app(SaveInvoiceDraft::class)->handle([
        'customer_id' => $this->customer->id, 'invoice_date' => '2026-10-10', 'due_date' => '2026-11-09', 'currency' => 'INR', 'discount_mode' => 'none', 'discount_value' => '0', 'terms' => 'Original terms', 'payment_instructions' => 'Original instructions',
        'items'       => [['key' => '00000000-0000-4000-8000-000000000001', 'service_id' => null, 'description' => 'Service', 'unit' => 'hour', 'quantity' => '1', 'rate' => '1000', 'taxes' => [['tax_rate_id' => null, 'name' => 'Tax', 'percentage' => '18']]]],
    ]);
});

function issuanceInput(Invoice $invoice, bool $seller = true, bool $customer = false): array
{
    $invoice->refresh();
    $review = app(InvoiceIssueReview::class)->prepare($invoice, $seller, $customer);

    return ['version' => $invoice->version, 'review_token' => $review['token'], 'refresh_seller' => $seller, 'refresh_customer' => $customer];
}

function issueForTest(Invoice $invoice): Invoice
{
    test()->post(route('admin.invoices.issue', $invoice), issuanceInput($invoice))->assertSessionHasNoErrors()->assertRedirect();

    return $invoice->refresh();
}

test('explicit issue allocates a number exactly once and records activity', function () {
    $this->get(route('admin.invoices.issue-review', $this->invoice))->assertOk()->assertInertia(fn (Assert $page) => $page->component('billing::invoices/issue-review')->has('review.errors', 0)->missing('review.logo'));
    $input = issuanceInput($this->invoice);
    $this->post(route('admin.invoices.issue', $this->invoice), $input)->assertSessionHasNoErrors();
    $this->post(route('admin.invoices.issue', $this->invoice), $input)->assertSessionHasNoErrors();
    $invoice = $this->invoice->refresh();
    expect($invoice->status)->toBe('issued')->and($invoice->formatted_number)->toBe('INV-000001')->and($invoice->sequence_number)->toBe(1)->and($invoice->issued_at)->not->toBeNull()->and($invoice->version)->toBe(2)->and($invoice->activities()->where('event', 'issued')->count())->toBe(1)->and(DB::table('billing_invoice_sequences')->value('next_number'))->toBe(2);
    $this->get(route('admin.invoices.show', $invoice))->assertOk()->assertInertia(fn (Assert $page) => $page->component('billing::invoices/show')->where('invoice.totals.total', '1180.00')->where('canCancel', true));
});

test('JSON issuance reads the locked customer and invoice lines once', function () {
    $input = issuanceInput($this->invoice);
    DB::enableQueryLog();
    try {
        $this->postJson(route('admin.invoices.issue', $this->invoice), $input)->assertOk()
            ->assertJsonPath('invoice.totals.total', '1180.00')
            ->assertJsonPath('invoice.items.0.taxes.0.amount', '180.00');
        $queries = collect(DB::getQueryLog())->pluck('query')->map(fn ($sql) => str_replace(['"', '`'], '', $sql));
    } finally {
        DB::disableQueryLog();
        DB::flushQueryLog();
    }
    foreach (['billing_invoice_items', 'billing_invoice_item_taxes'] as $table) {
        expect($queries->filter(fn ($sql) => str_starts_with($sql, 'select * from '.$table.' '))->count())->toBe(1);
    }
    expect($queries->filter(fn ($sql) => str_starts_with($sql, 'select * from billing_customers '))->count())->toBe(1)
        ->and($queries->filter(fn ($sql) => str_starts_with($sql, 'select count(*) as aggregate from billing_customers '))->count())->toBe(1);
});

test('reviewing the same draft instance still reloads changed customer and line details', function () {
    $review = app(InvoiceIssueReview::class)->prepare($this->invoice, true, true);
    $this->customer->update(['billing_address' => 'Updated customer street']);
    $this->invoice->items()->first()->taxes()->first()->update(['amount_minor' => 1]);
    $updated = app(InvoiceIssueReview::class)->prepare($this->invoice, true, true);
    expect($updated['customer']['billing_address'])->toBe('Updated customer street')
        ->and($updated['token'])->not->toBe($review['token'])
        ->and($updated['errors'])->toContain('Tax amounts have changed. Save the draft again.');
});

test('missing issuer and customer billing fields block issuance without consuming a number', function () {
    app(BillingSettings::class)->fill(['legal_name' => '', 'address' => '', 'country' => ''])->save();
    $this->customer->update(['billing_country' => '']);
    $review = app(InvoiceIssueReview::class)->prepare($this->invoice, true, true);
    expect($review['errors'])->not->toBeEmpty();
    $this->post(route('admin.invoices.issue', $this->invoice), issuanceInput($this->invoice, true, true))->assertSessionHasErrors('review');
    expect($this->invoice->fresh()->status)->toBe('draft')->and($this->invoice->fresh()->formatted_number)->toBeNull()->and(DB::table('billing_invoice_sequences')->value('next_number'))->toBe(1);
});

test('review fingerprint rejects changed company customer and number configuration', function (string $change) {
    $input = issuanceInput($this->invoice, true, true);
    match ($change) {
        'company'  => app(BillingSettings::class)->fill(['legal_name' => 'Changed issuer'])->save(),
        'customer' => $this->customer->update(['billing_address' => 'Changed address']),
        'number'   => app(BillingSettings::class)->fill(['number_prefix' => 'NEW-'])->save(),
    };
    $this->post(route('admin.invoices.issue', $this->invoice), $input)->assertSessionHasErrors('review');
    expect(DB::table('billing_invoice_sequences')->value('next_number'))->toBe(1);
})->with(['company', 'customer', 'number']);

test('stale draft review and altered tokens cannot issue a draft', function () {
    $input = issuanceInput($this->invoice);
    $this->invoice->forceFill(['version' => 2])->save();
    $this->post(route('admin.invoices.issue', $this->invoice), $input)->assertSessionHasErrors('review');
    $input                 = issuanceInput($this->invoice);
    $input['review_token'] = str_repeat('0', 64);
    $this->post(route('admin.invoices.issue', $this->invoice), $input)->assertSessionHasErrors('review');
    expect($this->invoice->fresh()->status)->toBe('draft');
});

test('archived customers and altered saved line amounts cannot be issued', function () {
    $this->customer->forceFill(['archived_at' => now()])->save();
    $this->post(route('admin.invoices.issue', $this->invoice), issuanceInput($this->invoice))->assertSessionHasErrors('review');
    $this->customer->forceFill(['archived_at' => null])->save();
    $this->invoice->items()->first()->taxes()->first()->update(['amount_minor' => 1]);
    $this->post(route('admin.invoices.issue', $this->invoice), issuanceInput($this->invoice))->assertSessionHasErrors('review');
    expect(DB::table('billing_invoice_sequences')->value('next_number'))->toBe(1);
});

test('saved or current snapshots are explicitly selectable and issued values are frozen', function () {
    $this->customer->update(['display_name' => 'Changed customer']);
    app(BillingSettings::class)->fill(['legal_name' => 'Changed issuer'])->save();
    $this->post(route('admin.invoices.issue', $this->invoice), issuanceInput($this->invoice, false, false))->assertSessionHasNoErrors();
    $invoice = $this->invoice->refresh();
    expect($invoice->seller_snapshot['legal_name'])->toBe('Example Issuer')->and($invoice->customer_snapshot['display_name'])->toBe('Example Customer')->and($invoice->customer_name)->toBe('Example Customer');
    $this->customer->update(['display_name' => 'Another customer']);
    app(BillingSettings::class)->fill(['legal_name' => 'Another issuer', 'payment_instructions' => 'New instructions'])->save();
    $this->get(route('admin.invoices.show', $invoice))->assertOk()->assertInertia(fn (Assert $page) => $page->where('invoice.seller_snapshot.legal_name', 'Example Issuer')->where('invoice.customer_snapshot.display_name', 'Example Customer')->where('invoice.payment_instructions', 'Original instructions')->where('invoice.totals.total', '1180.00'));
    $this->get(route('admin.invoices.edit', $invoice))->assertStatus(409);
    $data = app(\Modules\Billing\Services\InvoicePresentation::class)->data($invoice);
    $this->patch(route('admin.invoices.update', $invoice), [...$data, 'status' => 'draft', 'formatted_number' => 'CHANGED', 'total_minor' => 1])->assertStatus(409);
    expect($invoice->fresh()->formatted_number)->toBe('INV-000001')->and($invoice->fresh()->total_minor)->toBe(118000);
});

test('frozen logo bytes survive changes to the original and remain private', function () {
    Storage::fake('public');
    Storage::fake('local');
    $image = imagecreatetruecolor(4, 4);
    ob_start();
    imagepng($image);
    $bytes = ob_get_clean();
    Storage::disk('public')->put('logo.png', $bytes);
    $media = Media::withoutEvents(fn () => Media::forceCreate(['disk' => 'public', 'directory' => '', 'filename' => 'logo', 'extension' => 'png', 'mime_type' => 'image/png', 'aggregate_type' => 'image', 'size' => strlen($bytes)]));
    app(BillingSettings::class)->fill(['logo_media_id' => $media->id])->save();
    $invoice = issueForTest($this->invoice);
    $copy    = $invoice->seller_snapshot['logo_file'];
    Storage::disk('public')->put('logo.png', 'changed original');
    expect(Storage::disk('local')->get($copy['path']))->toBe($bytes)->and($copy['sha256'])->toBe(hash('sha256', $bytes));
    $this->get(route('admin.invoices.show', $invoice))->assertOk()->assertInertia(fn (Assert $page) => $page->missing('invoice.seller_snapshot.logo_file'));
});

test('review reads a company logo once and previews only the selected seller snapshot', function () {
    Storage::fake('public');
    $image = imagecreatetruecolor(4, 4);
    ob_start();
    imagepng($image);
    $bytes = ob_get_clean();
    imagedestroy($image);
    $disk = Storage::disk('public');
    $disk->put('review-logo.png', $bytes);
    $media = Media::withoutEvents(fn () => Media::forceCreate(['disk' => 'public', 'directory' => '', 'filename' => 'review-logo', 'extension' => 'png', 'mime_type' => 'image/png', 'aggregate_type' => 'image', 'size' => strlen($bytes)]));
    app(BillingSettings::class)->fill(['logo_media_id' => $media->id])->save();
    $spy = Mockery::spy($disk);
    Storage::shouldReceive('disk')->with('public')->andReturn($spy);

    $review = app(InvoiceIssueReview::class)->prepare($this->invoice, true, false);
    expect($review['errors'])->toBeEmpty()
        ->and($review['invoice']['logo'])->toBe('data:image/png;base64,'.base64_encode($bytes))
        ->and($review['logo']['hash'])->toBe(hash('sha256', $bytes));

    // The draft predates the new logo; keeping its seller snapshot must keep its original preview.
    $original = app(InvoiceIssueReview::class)->prepare($this->invoice, false, false);
    expect($original['invoice']['logo'])->toBeNull()->and($original['logo'])->toBeNull();
    $spy->shouldHaveReceived('readStream')->with('review-logo.png')->once();

    $image = imagecreatetruecolor(4, 4);
    imagefill($image, 0, 0, imagecolorallocate($image, 255, 255, 255));
    ob_start();
    imagepng($image);
    $changed = ob_get_clean();
    imagedestroy($image);
    $disk->put('review-logo.png', $changed);
    $updated = app(InvoiceIssueReview::class)->prepare($this->invoice, true, false);
    expect($updated['token'])->not->toBe($review['token'])
        ->and($updated['invoice']['logo'])->toBe('data:image/png;base64,'.base64_encode($changed));
});

test('number collisions roll back issuance counter and activity', function () {
    $other = $this->invoice->replicate();
    $other->forceFill(['formatted_number' => 'INV-000001', 'sequence_number' => 99])->save();
    expect(fn () => app(\Modules\Billing\Actions\IssueInvoice::class)->handle($this->invoice, issuanceInput($this->invoice), $this->admin))->toThrow(QueryException::class);
    expect($this->invoice->fresh()->status)->toBe('draft')->and(DB::table('billing_invoice_sequences')->value('next_number'))->toBe(1)->and($this->invoice->activities()->where('event', 'issued')->count())->toBe(0);
});

test('cancellation retains the number and cannot be undone or used on a draft', function () {
    $this->post(route('admin.invoices.cancel', $this->invoice), ['version' => 1, 'reason' => 'A valid reason'])->assertStatus(409);
    $invoice = issueForTest($this->invoice);
    $input   = ['version' => $invoice->version, 'reason' => 'Duplicate local invoice'];
    $this->post(route('admin.invoices.cancel', $invoice), $input)->assertSessionHasNoErrors();
    $this->post(route('admin.invoices.cancel', $invoice), [...$input, 'reason' => 'Changed reason'])->assertSessionHasNoErrors();
    $invoice->refresh();
    expect($invoice->status)->toBe('cancelled')->and($invoice->formatted_number)->toBe('INV-000001')->and($invoice->sequence_number)->toBe(1)->and($invoice->cancellation_reason)->toBe('Duplicate local invoice')->and($invoice->activities()->where('event', 'cancelled')->count())->toBe(1)->and(DB::table('billing_invoice_sequences')->value('next_number'))->toBe(2);
    $this->post(route('admin.invoices.issue', $invoice), issuanceInput($invoice))->assertStatus(409);
});

test('cancellation requires a reason and blocks active payments', function () {
    $invoice = issueForTest($this->invoice);
    $this->postJson(route('admin.invoices.cancel', $invoice), ['version' => $invoice->version, 'reason' => ' '])->assertUnprocessable()->assertJsonValidationErrors('reason');
    $payment = app(\Modules\Billing\Actions\ManagePayments::class)->record($invoice, ['version' => $invoice->version, 'request_key' => (string) \Illuminate\Support\Str::uuid(), 'amount' => '100', 'currency' => 'INR', 'payment_date' => '2026-10-10', 'method' => 'cash'], $this->admin);
    $invoice->refresh();
    $this->post(route('admin.invoices.cancel', $invoice), ['version' => $invoice->version, 'reason' => 'Requested cancellation'])->assertSessionHasErrors('reason');
    expect($invoice->fresh()->status)->toBe('issued');
    app(\Modules\Billing\Actions\ManagePayments::class)->reverse($payment, ['version' => $invoice->version, 'reason' => 'Test reversal'], $this->admin);
    $invoice->refresh();
    $this->post(route('admin.invoices.cancel', $invoice), ['version' => $invoice->version, 'reason' => 'Requested cancellation'])->assertSessionHasNoErrors();
});

test('cancelled numbers are never reused and prefix changes preserve the global sequence', function () {
    $one = issueForTest($this->invoice);
    $this->post(route('admin.invoices.cancel', $one), ['version' => $one->version, 'reason' => 'Duplicate invoice'])->assertSessionHasNoErrors();
    $second = $one->replicate();
    $second->forceFill(['status' => 'draft', 'formatted_number' => null, 'sequence_number' => null, 'issued_at' => null, 'cancelled_at' => null, 'cancellation_reason' => null, 'version' => 1])->save();
    foreach ($one->items as $item) {
        $copy             = $item->replicate();
        $copy->invoice_id = $second->id;
        $copy->save();
        foreach ($item->taxes as $tax) {
            $taxCopy                  = $tax->replicate();
            $taxCopy->invoice_item_id = $copy->id;
            $taxCopy->save();
        }
    }
    app(BillingSettings::class)->fill(['number_prefix' => 'NEW-', 'number_padding' => 4])->save();
    $two = issueForTest($second);
    expect($two->formatted_number)->toBe('NEW-0002')->and($two->sequence_number)->toBe(2)->and($one->fresh()->formatted_number)->toBe('INV-000001');
});

test('issued rendering uses stored amounts without running the calculator', function () {
    $invoice = issueForTest($this->invoice);
    $this->mock(\Modules\Billing\Services\InvoiceCalculator::class, fn ($mock) => $mock->shouldNotReceive('calculate'));
    $this->get(route('admin.invoices.show', $invoice))->assertOk()->assertInertia(fn (Assert $page) => $page->where('invoice.totals.total', '1180.00'));
});

test('issue and cancel permissions are independent from editing and viewing', function () {
    $input  = issuanceInput($this->invoice);
    $reader = User::factory()->create()->givePermissionTo(['view any invoice', 'view invoice', 'update invoice']);
    $this->actingAs($reader)->get(route('admin.invoices.issue-review', $this->invoice))->assertForbidden();
    $this->post(route('admin.invoices.issue', $this->invoice), $input)->assertForbidden();
    $this->post(route('admin.invoices.cancel', $this->invoice), ['version' => 1, 'reason' => 'Not authorized'])->assertForbidden();
    $this->get(route('admin.invoices.show', $this->invoice))->assertOk()->assertInertia(fn (Assert $page) => $page->where('canIssue', false));
});

test('issuance cannot reuse a historical number even if the counter is reset', function () {
    $historical = $this->invoice->replicate();
    $historical->forceFill(['status' => 'issued', 'formatted_number' => 'INV-000001', 'number_scope' => 'legacy:example'])->save();
    $this->post(route('admin.invoices.issue', $this->invoice), issuanceInput($this->invoice))->assertSessionHasErrors('review');
    expect($this->invoice->fresh()->status)->toBe('draft')
        ->and(DB::table('billing_invoice_sequences')->where('scope', 'invoices')->value('next_number'))->toBe(1)
        ->and($this->invoice->activities()->where('event', 'issued')->count())->toBe(0);
});
