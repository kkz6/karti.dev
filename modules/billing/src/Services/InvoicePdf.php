<?php

namespace Modules\Billing\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Modules\Billing\Contracts\InvoicePdfRenderer;
use Modules\Billing\Models\Invoice;

class InvoicePdf
{
    public const TEMPLATE_VERSION = '1';

    public function __construct(private InvoicePdfRenderer $renderer) {}

    public function data(Invoice $invoice, bool $includeTransactions = false): array
    {
        $document = Arr::except(app(InvoicePresentation::class)->data($invoice), ['internal_note', 'version']);
        $logo     = $this->logo($invoice);
        $label    = $invoice->formatted_number ?? 'Draft #'.$invoice->id;

        $settlement = app(InvoiceBalance::class)->data($invoice);
        $payments   = $includeTransactions ? $invoice->payments->whereNull('reversed_at')->map(fn ($payment) => ['id' => $payment->id, 'method' => $payment->method_label, 'date' => $payment->payment_date->format('Y-m-d'), 'amount' => InvoiceCalculator::money((string) $payment->amount_minor, $payment->currency_precision)])->values()->all() : [];

        return ['settlement' => $settlement, 'payments' => $payments, 'invoice'   => $document, 'logo' => $logo, 'signature' => app(InvoiceSignature::class)->data(), 'label' => $label,
            'sellerLines'    => InvoicePdfLayout::party($document['seller_snapshot']),
            'customerLines'  => InvoicePdfLayout::party($document['customer_snapshot'], true),
            'rows'           => InvoicePdfLayout::rows($document['items'])];
    }

    /** Issued/cancelled documents are cached privately by content, including the current settlement and permitted transaction projection. */
    public function document(Invoice $invoice, bool $includeTransactions = false): array
    {
        $data        = $this->data($invoice, $includeTransactions);
        $fingerprint = hash('sha256', json_encode([self::TEMPLATE_VERSION, hash_file('sha256', __DIR__.'/../../resources/views/pdf/invoice.blade.php'), $data], JSON_THROW_ON_ERROR));
        $name        = ($invoice->status === 'draft' ? 'draft-' : ($invoice->status === 'cancelled' ? 'cancelled-' : '')).preg_replace('/[^A-Za-z0-9._-]/', '-', $data['label']).'.pdf';
        if ($invoice->status === 'draft') {
            return ['bytes' => $this->render($data), 'name' => $name, 'path' => null, 'fingerprint' => $fingerprint];
        }
        $path  = 'billing/invoices/'.$invoice->id.'/pdf/'.$fingerprint.'.pdf';
        $disk  = Storage::disk('local');
        $bytes = Cache::lock('billing-pdf:'.$invoice->id.':'.$fingerprint, 120)->block(15, function () use ($disk, $path, $data) {
            $bytes    = $disk->get($path);
            $checksum = $disk->get($path.'.sha256');
            if (is_string($bytes) && is_string($checksum) && hash_equals($checksum, hash('sha256', $bytes)) && str_starts_with($bytes, '%PDF-')) {
                return $bytes;
            }
            $bytes = $this->render($data);
            if (! $disk->put($path, $bytes, ['visibility' => 'private']) || ! $disk->put($path.'.sha256', hash('sha256', $bytes), ['visibility' => 'private'])) {
                $disk->delete([$path, $path.'.sha256']);
                throw new \RuntimeException('Unable to store the invoice PDF privately.');
            }

            return $bytes;
        });

        return ['bytes' => $bytes, 'name' => $name, 'path' => $path, 'fingerprint' => $fingerprint];
    }

    private function render(array $data): string
    {
        $bytes = $this->renderer->render($data);
        if (! str_starts_with($bytes, '%PDF-') || ! str_contains(substr($bytes, -1024), '%%EOF')) {
            throw new \RuntimeException('The PDF renderer did not return a complete document.');
        }

        return $bytes;
    }

    public function logo(Invoice $invoice): ?string
    {
        $file = $invoice->status === 'draft' ? null : ($invoice->seller_snapshot['logo_file'] ?? null);
        if (! $file) {
            $id    = app(\Modules\Billing\Settings\BillingSettings::class)->logo_media_id;
            $media = $id ? \Modules\Media\Models\Media::find($id) : null;

            return $media ? app(BillingBrandingImage::class)->image($media) : null;
        }
        if (($file['disk'] ?? '') !== 'local' || ! str_starts_with($file['path'] ?? '', 'billing/invoices/') || str_contains($file['path'], '..')) {
            throw new \RuntimeException('Invalid frozen invoice logo descriptor.');
        }
        $stream = Storage::disk('local')->readStream($file['path']);
        if (! is_resource($stream)) {
            throw new \RuntimeException('Frozen invoice logo is unavailable.');
        }
        try {
            $bytes = stream_get_contents($stream, 5 * 1024 * 1024 + 1);
        } finally {
            fclose($stream);
        }
        $info = @getimagesizefromstring($bytes);
        if (! $info || strlen($bytes) > 5 * 1024 * 1024 || ! in_array($info['mime'], ['image/png', 'image/jpeg', 'image/webp'], true) || ! hash_equals($file['sha256'] ?? '', hash('sha256', $bytes))) {
            throw new \RuntimeException('Frozen invoice logo failed integrity verification.');
        }
        if ($info['mime'] === 'image/webp') {
            $image = imagecreatefromstring($bytes);
            if (! $image) {
                throw new \RuntimeException('Unable to decode frozen logo.');
            }
            ob_start();
            try {
                imagepng($image);
                $bytes = ob_get_contents();
            } finally {
                ob_end_clean();
                imagedestroy($image);
            }
            $mime = 'image/png';
        } else {
            $mime = $info['mime'];
        }

        return 'data:'.$mime.';base64,'.base64_encode($bytes);
    }
}
