<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Auth\Models\User;
use Modules\Billing\Actions\IssueInvoice;
use Modules\Billing\Actions\SaveInvoiceDraft;
use Modules\Billing\Contracts\InvoicePdfRenderer;
use Modules\Billing\Models\Customer;
use Modules\Billing\Services\InvoiceIssueReview;
use Modules\Billing\Services\InvoicePdf;
use Modules\Billing\Services\InvoicePdfLayout;
use Modules\Billing\Settings\BillingSettings;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('local');
    $this->admin = User::factory()->create()->assignRole('admin');
    $this->actingAs($this->admin);
    app(BillingSettings::class)->fill(['legal_name' => 'Café Example', 'address' => 'Issuer street', 'country' => 'IN'])->save();
    $this->customer = Customer::factory()->create(['display_name' => 'Zoë Müller', 'billing_address' => 'Customer street', 'billing_country' => 'IN']);
    $this->invoice  = app(SaveInvoiceDraft::class)->handle([
        'customer_id' => $this->customer->id, 'invoice_date' => '2026-10-10', 'due_date' => '2026-11-09', 'currency' => 'INR', 'discount_mode' => 'percent', 'discount_value' => '10', 'customer_note' => 'Thank you', 'internal_note' => 'SECRET INTERNAL NOTE', 'terms' => 'Due in thirty days', 'payment_instructions' => 'Pay by bank transfer',
        'items'       => [['key' => (string) Str::uuid(), 'description' => 'Architecture review', 'additional_description' => 'Original scope', 'unit' => 'hour', 'quantity' => '1', 'rate' => '100', 'taxes' => [['name' => 'VAT', 'percentage' => '18']]]],
    ]);
});

function pdfIssueInvoice(): void
{
    $invoice        = test()->invoice;
    $review         = app(InvoiceIssueReview::class)->prepare($invoice, true, false);
    test()->invoice = app(IssueInvoice::class)->handle($invoice, ['version' => $invoice->version, 'review_token' => $review['token'], 'refresh_seller' => true, 'refresh_customer' => false], test()->admin);
}

function fakeInvoiceRenderer(): object
{
    $renderer = new class implements InvoicePdfRenderer
    {
        public int $calls = 0;

        public array $data = [];

        public function render(array $data): string
        {
            $this->calls++;
            $this->data = $data;

            return "%PDF-1.7\nTest PDF\n%%EOF";
        }
    };
    app()->instance(InvoicePdfRenderer::class, $renderer);

    return $renderer;
}

test('pdf access requires authentication invoice view and a separate download permission', function () {
    $url = route('admin.invoices.pdf', $this->invoice);
    auth()->logout();
    $this->get($url)->assertRedirect(route('login'));
    $reader = User::factory()->create()->givePermissionTo('view invoice');
    $this->actingAs($reader)->get($url)->assertForbidden();
    $reader->givePermissionTo('download invoice');
    fakeInvoiceRenderer();
    $this->get($url)->assertOk()->assertHeader('Content-Type', 'application/pdf');
    $reader->revokePermissionTo('view invoice');
    $this->get($url)->assertForbidden();
});

test('draft pdf is visibly marked and never consumes a number or persists an issued file', function () {
    $before   = $this->invoice->only(['version', 'status', 'formatted_number', 'total_minor']);
    $response = $this->get(route('admin.invoices.pdf', $this->invoice));
    $response->assertOk()->assertHeader('Content-Type', 'application/pdf');
    expect($response->headers->get('Content-Disposition'))->toContain('inline;', 'draft-Draft-');
    $html = view('billing::pdf.invoice', app(InvoicePdf::class)->data($this->invoice))->render();
    expect($html)->toContain('DRAFT INVOICE', 'DRAFT - NOT ISSUED', '106.20', 'VAT', 'Due in thirty days', 'Pay by bank transfer')->not->toContain('SECRET INTERNAL NOTE');
    expect($this->invoice->fresh()->only(array_keys($before)))->toBe($before)->and(Storage::disk('local')->allFiles('billing'))->toBeEmpty();
});

test('issued pdf uses frozen data caches privately and does not change when invoice payment versions change', function () {
    pdfIssueInvoice();
    $renderer = fakeInvoiceRenderer();
    $first    = app(InvoicePdf::class)->document($this->invoice);
    app(BillingSettings::class)->fill(['legal_name' => 'Changed issuer'])->save();
    $this->customer->update(['display_name' => 'Changed customer']);
    $this->invoice->forceFill(['version' => 20])->save();
    $second = app(InvoicePdf::class)->document($this->invoice->fresh());
    expect($renderer->calls)->toBe(1)->and($first['bytes'])->toBe($second['bytes'])->and($first['path'])->toBe($second['path'])->and($renderer->data['invoice']['seller_snapshot']['legal_name'])->toBe('Café Example')->and($renderer->data['invoice']['customer_snapshot']['display_name'])->toBe('Zoë Müller')->and($renderer->data['invoice']['totals']['total'])->toBe('106.20');
    expect($renderer->data['invoice'])->not->toHaveKey('internal_note')->and(Storage::disk('local')->exists($first['path']))->toBeTrue()->and(Storage::disk('local')->getVisibility($first['path']))->toBe('private');
    $response = $this->get(route('admin.invoices.pdf', ['invoice' => $this->invoice->id, 'download' => 1]));
    $response->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
    expect($response->headers->get('Content-Disposition'))->toContain('attachment;', 'INV-000001.pdf')->and($response->headers->get('Cache-Control'))->toContain('private', 'no-store');
});

test('cancelled pdf has a distinct cache entry and visible cancellation marking', function () {
    pdfIssueInvoice();
    fakeInvoiceRenderer();
    $issued = app(InvoicePdf::class)->document($this->invoice);
    $this->invoice->forceFill(['status' => 'cancelled', 'cancellation_reason' => 'Duplicate', 'cancelled_at' => now()])->save();
    $cancelled = app(InvoicePdf::class)->document($this->invoice->fresh());
    expect($cancelled['path'])->not->toBe($issued['path'])->and($cancelled['name'])->toBe('cancelled-INV-000001.pdf');
    expect(view('billing::pdf.invoice', app(InvoicePdf::class)->data($this->invoice))->render())->toContain('CANCELLED - DO NOT PAY');
});

test('frozen logo bytes are embedded and corrupted or missing logos fail without using current media', function () {
    pdfIssueInvoice();
    fakeInvoiceRenderer();
    $bytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6iS8AAAAASUVORK5CYII=');
    $path  = 'billing/invoices/'.$this->invoice->id.'/logo-test.png';
    Storage::disk('local')->put($path, $bytes);
    $this->invoice->forceFill(['seller_snapshot' => [...$this->invoice->seller_snapshot, 'logo_file' => ['disk' => 'local', 'path' => $path, 'sha256' => hash('sha256', $bytes)]]])->save();
    expect(app(InvoicePdf::class)->data($this->invoice)['logo'])->toBe('data:image/png;base64,'.base64_encode($bytes));
    Storage::disk('local')->put($path, 'corrupt');
    $this->get(route('admin.invoices.pdf', $this->invoice))->assertRedirect(route('admin.invoices.show', $this->invoice))->assertSessionHas('billing_pdf_error');
    Storage::disk('local')->delete($path);
    $this->get(route('admin.invoices.pdf', $this->invoice))->assertSessionHas('billing_pdf_error');
});

test('draft previews and issued pdfs fit logo artwork while preserving source files and signature spacing', function (string $format) {
    Storage::fake('public');
    $image = imagecreatetruecolor(100, 60);
    imagealphablending($image, false);
    imagesavealpha($image, true);
    imagefill($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 127));
    imagefilledrectangle($image, 25, 20, 74, 39, imagecolorallocatealpha($image, 10, 20, 30, 0));
    ob_start();
    $format === 'webp' ? imagewebp($image, null, 100) : imagepng($image);
    $bytes = ob_get_clean();
    imagedestroy($image);
    $path = 'billing/padded-logo.'.$format;
    Storage::disk('public')->put($path, $bytes);
    $media = \Modules\Media\Models\Media::withoutEvents(fn () => \Modules\Media\Models\Media::forceCreate([
        'disk'      => 'public', 'directory' => 'billing', 'filename' => 'padded-logo',
        'extension' => $format, 'mime_type' => 'image/'.$format, 'aggregate_type' => 'image', 'size' => strlen($bytes),
    ]));
    app(BillingSettings::class)->fill(['logo_media_id' => $media->id, 'signature_media_id' => $media->id, 'show_signature_on_invoices' => true])->save();

    $preview = app(\Modules\Billing\Services\InvoicePresentation::class)->brandedData($this->invoice);
    $draft   = app(InvoicePdf::class)->data($this->invoice);
    expect($draft['logo'])->toBe($preview['logo']);
    expect(array_slice(getimagesizefromstring(base64_decode(explode(',', $draft['logo'], 2)[1])), 0, 2))->toBe([50, 20]);
    expect(array_slice(getimagesizefromstring(base64_decode(explode(',', $draft['signature']['image'], 2)[1])), 0, 2))->toBe([100, 60]);

    pdfIssueInvoice();
    $frozen = $this->invoice->seller_snapshot['logo_file'];
    app(BillingSettings::class)->fill(['logo_media_id' => null])->save();
    expect(app(InvoicePdf::class)->data($this->invoice)['logo'])->toBe($draft['logo']);
    expect(Storage::disk('public')->get($path))->toBe($bytes)
        ->and(Storage::disk('local')->get($frozen['path']))->toBe($bytes)
        ->and($frozen['sha256'])->toBe(hash('sha256', $bytes));
})->with(['png', 'webp']);

test('corrupted private pdf cache is regenerated and incomplete renderer output is rejected', function () {
    pdfIssueInvoice();
    $renderer = fakeInvoiceRenderer();
    $document = app(InvoicePdf::class)->document($this->invoice);
    Storage::disk('local')->put($document['path'], 'corrupt');
    app(InvoicePdf::class)->document($this->invoice);
    expect($renderer->calls)->toBe(2);
    app()->instance(InvoicePdfRenderer::class, new class implements InvoicePdfRenderer
    {
        public function render(array $data): string
        {
            return '%PDF-incomplete';
        }
    });
    Storage::disk('local')->delete($document['path']);
    $this->get(route('admin.invoices.pdf', $this->invoice))->assertSessionHas('billing_pdf_error');
    expect(Storage::disk('local')->exists($document['path']))->toBeFalse();
});

test('renderer failures produce recoverable feedback and do not mutate the invoice', function () {
    app()->instance(InvoicePdfRenderer::class, new class implements InvoicePdfRenderer
    {
        public function render(array $data): string
        {
            throw new RuntimeException('PRIVATE FAILURE DETAILS');
        }
    });
    $this->get(route('admin.invoices.pdf', $this->invoice))->assertRedirect(route('admin.invoices.show', $this->invoice))->assertSessionHas('billing_pdf_error', fn ($message) => ! str_contains($message, 'PRIVATE FAILURE DETAILS'));
    $this->get(route('admin.invoices.show', $this->invoice))->assertInertia(fn (Assert $page) => $page->where('canDownloadPdf', true)->where('pdfError', fn ($message) => str_contains($message, 'could not be generated')));
    expect($this->invoice->fresh()->version)->toBe(1);
});

test('pdf layout breaks long descriptions into bounded continuation rows and escapes user markup', function () {
    $item                           = app(InvoicePdf::class)->data($this->invoice)['invoice']['items'][0];
    $item['description']            = '<script>alert("x")</script>';
    $item['additional_description'] = str_repeat('Résumé delivery scope ', 450).' FINAL-SCOPE-MARKER';
    $rows                           = InvoicePdfLayout::rows([$item]);
    expect(count($rows))->toBeGreaterThan(5)->and($rows[0]['continued'])->toBeFalse()->and($rows[1]['continued'])->toBeTrue();
    foreach ($rows as $row) {
        expect(count($row['content']))->toBeLessThanOrEqual(4);
        foreach ($row['content'] as $line) {
            $metrics = (new \Dompdf\Dompdf(\Modules\Billing\Services\BillingPdfFonts::options()))->getFontMetrics();
            $font    = $metrics->getFont('FreeSans', $line['bold'] ? 'bold' : 'normal');
            expect($metrics->getTextWidth($line['text'], $font, 10))->toBeLessThanOrEqual((595.28 - 72) * 0.46 - 18);
        }
    }
    $data         = app(InvoicePdf::class)->data($this->invoice);
    $data['rows'] = $rows;
    $html         = view('billing::pdf.invoice', $data)->render();
    expect($html)->toContain('&lt;script&gt;', 'FINAL-SCOPE-MARKER')->not->toContain('<script>alert', ' - continued');
});

test('pdf settlement stays current while transaction details follow permission and exclude reversed receipts', function () {
    pdfIssueInvoice();
    $renderer = fakeInvoiceRenderer();
    $initial  = app(InvoicePdf::class)->document($this->invoice);
    $payment  = app(\Modules\Billing\Actions\ManagePayments::class)->record($this->invoice, ['version' => $this->invoice->version, 'request_key' => (string) Str::uuid(), 'amount' => '40', 'currency' => 'INR', 'payment_date' => '2026-10-10', 'method' => 'cash', 'notes' => 'PRIVATE PAYMENT NOTE'], $this->admin);
    $paid     = app(InvoicePdf::class)->document($this->invoice->fresh(), true);
    expect($paid['path'])->not->toBe($initial['path'])->and($renderer->data['settlement']['paid'])->toBe('40.00')->and($renderer->data['settlement']['balance'])->toBe('66.20')->and($renderer->data['payments'])->toHaveCount(1);
    expect($renderer->data['payments'][0])->not->toHaveKeys(['notes', 'actor_name', 'reference']);
    $reader = User::factory()->create()->givePermissionTo(['view invoice', 'download invoice']);
    $this->actingAs($reader)->get(route('admin.invoices.pdf', $this->invoice))->assertOk();
    expect($renderer->data['payments'])->toBeEmpty()->and($renderer->data['settlement']['paid'])->toBe('40.00');
    app(\Modules\Billing\Actions\ManagePayments::class)->reverse($payment, ['version' => $this->invoice->fresh()->version, 'reason' => 'Incorrect record'], $this->admin);
    $data = app(InvoicePdf::class)->data($this->invoice->fresh(), true);
    expect($data['payments'])->toBeEmpty()->and($data['settlement']['balance'])->toBe('106.20');
});

test('issued internal notes can change with audit while customer pdf data and immutable totals do not change', function () {
    pdfIssueInvoice();
    $before=$this->invoice->only(['total_minor', 'formatted_number', 'seller_snapshot', 'customer_snapshot']);
    $this->patch(route('admin.invoices.internal-note', $this->invoice), ['version'=>$this->invoice->version, 'internal_note'=>'PRIVATE STAFF FOLLOW-UP'])->assertSessionHasNoErrors();
    expect($this->invoice->fresh()->only(array_keys($before)))->toBe($before)->and($this->invoice->fresh()->internal_note)->toBe('PRIVATE STAFF FOLLOW-UP')->and($this->invoice->activities()->where('event', 'internal_note_updated')->count())->toBe(1);
    expect(app(InvoicePdf::class)->data($this->invoice->fresh())['invoice'])->not->toHaveKey('internal_note');
});

test('legacy description breaks are compact in presentation and pdf without rewriting stored history', function () {
    $source = "Table\n\r\n1. First field\n\r\n2. Second field\n\r\n\n\r\n\n\r\nPayment screen\n\r\n1. Last field";
    $item   = $this->invoice->items()->first();
    $item->update(['description' => "Consulting\r\nDelivery", 'additional_description' => $source]);
    $data = app(InvoicePdf::class)->data($this->invoice->fresh());
    expect($data['invoice']['items'][0]['additional_description'])->toBe("Table\n1. First field\n2. Second field\n\nPayment screen\n1. Last field")
        ->and($item->fresh()->additional_description)->toBe($source)
        ->and(array_column($data['rows'][0]['content'], 'text'))->toBe(['Consulting Delivery', 'Table', '1. First field', '2. Second field']);
    $allLines = collect($data['rows'])->flatMap(fn ($row) => array_column($row['content'], 'text'))->all();
    expect($allLines)->toBe(['Consulting Delivery', 'Table', '1. First field', '2. Second field', '', 'Payment screen', '1. Last field']);
});

test('ordinary paragraph breaks and unicode descriptions remain readable', function () {
    expect(\Modules\Billing\Services\InvoiceText::description("Résumé\r\n\r\nDelivery\r\nNext line"))->toBe("Résumé\n\nDelivery\nNext line")
        ->and(\Modules\Billing\Services\InvoiceText::description(null))->toBeNull();
});

test('invoice signatures follow current settings and invalidate cached documents', function () {
    Storage::fake('public');
    $bytes = (function () {
        $image = imagecreatetruecolor(240, 60);
        imagefill($image, 0, 0, imagecolorallocate($image, 255, 255, 255));
        imagestring($image, 5, 15, 20, 'Signature', imagecolorallocate($image, 25, 25, 25));
        ob_start();
        imagepng($image);
        $bytes = ob_get_clean();
        imagedestroy($image);

        return $bytes;
    })();
    Storage::disk('public')->put('billing/signature.png', $bytes);
    $media = \Modules\Media\Models\Media::withoutEvents(fn () => \Modules\Media\Models\Media::forceCreate(['disk' => 'public', 'directory' => 'billing', 'filename' => 'signature', 'extension' => 'png', 'mime_type' => 'image/png', 'aggregate_type' => 'image', 'size' => strlen($bytes)]));
    pdfIssueInvoice();
    fakeInvoiceRenderer();
    $pdf    = app(InvoicePdf::class);
    $before = $pdf->document($this->invoice);
    app(BillingSettings::class)->fill(['signature_media_id' => $media->id, 'show_signature_on_invoices' => true])->save();
    $signed = $pdf->document($this->invoice);
    expect($signed['fingerprint'])->not->toBe($before['fingerprint']);
    $data = $pdf->data($this->invoice);
    expect($data['signature']['image'])->toBe('data:image/png;base64,'.base64_encode($bytes));
    $rendered = app(\Modules\Billing\Services\DompdfInvoiceRenderer::class)->render($data);
    expect($rendered)->toStartWith('%PDF-')->toContain('%%EOF');
    $html = view('billing::pdf.invoice', $data)->render();
    expect($html)->toContain('Authorized signature', $data['signature']['image']);
    $this->get(route('admin.invoices.pdf', $this->invoice))->assertOk();
    app(BillingSettings::class)->fill(['signature_media_id' => null])->save();
    expect(view('billing::pdf.invoice', $pdf->data($this->invoice))->render())->toContain('Authorized signature', '_________________________');
    app(BillingSettings::class)->fill(['show_signature_on_invoices' => false])->save();
    expect(view('billing::pdf.invoice', $pdf->data($this->invoice))->render())->not->toContain('Authorized signature');
});

test('current logo appears in draft previews and imported invoices without changing historical addresses', function () {
    Storage::fake('public');
    $image = imagecreatetruecolor(240, 60);
    imagefill($image, 0, 0, imagecolorallocate($image, 255, 255, 255));
    imagestring($image, 5, 15, 20, 'karti.dev', imagecolorallocate($image, 25, 25, 25));
    ob_start();
    imagepng($image);
    $bytes = ob_get_clean();
    imagedestroy($image);
    Storage::disk('public')->put('billing/company.png', $bytes);
    $logo = \Modules\Media\Models\Media::withoutEvents(fn () => \Modules\Media\Models\Media::forceCreate(['disk' => 'public', 'directory' => 'billing', 'filename' => 'company', 'extension' => 'png', 'mime_type' => 'image/png', 'aggregate_type' => 'image', 'size' => strlen($bytes)]));
    // Issued/imported records without frozen branding retain their historical identity.
    pdfIssueInvoice();
    $historical = $this->invoice->seller_snapshot;
    app(BillingSettings::class)->fill(['logo_media_id' => $logo->id, 'address' => 'Current company address'])->save();
    expect(app(InvoicePdf::class)->data($this->invoice)['logo'])->toBe('data:image/png;base64,'.base64_encode($bytes));
    expect(app(InvoicePdf::class)->data($this->invoice)['invoice']['seller_snapshot']['address'])->toBe($historical['address']);
    $data  = app(\Modules\Billing\Services\InvoicePresentation::class)->data($this->invoice);
    $draft = app(SaveInvoiceDraft::class)->handle($data);
    expect($draft->seller_snapshot['address'])->toBe('Current company address');
    expect(app(InvoicePdf::class)->data($draft)['logo'])->toBe('data:image/png;base64,'.base64_encode($bytes));
    $this->getJson(route('admin.invoices.show', $this->invoice))->assertOk()->assertJsonPath('invoice.logo', 'data:image/png;base64,'.base64_encode($bytes));
    expect($this->invoice->fresh()->seller_snapshot)->toBe($historical);
});
