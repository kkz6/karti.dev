<?php

namespace Modules\Billing\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Modules\Billing\Http\Requests\SaveInvoiceRequest;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Settings\BillingSettings;
use Modules\Billing\Support\Currencies;
use Modules\Media\Models\Media;

class InvoiceIssueReview
{
    public function prepare(Invoice $invoice, bool $refreshSeller, bool $refreshCustomer): array
    {
        $invoice->load('customer');
        $data     = app(InvoicePresentation::class)->data($invoice);
        $seller   = $refreshSeller ? BillingSnapshots::seller() : $invoice->seller_snapshot;
        $customer = $refreshCustomer ? BillingSnapshots::customer($invoice->customer) : $invoice->customer_snapshot;
        $errors   = Validator::make(['seller' => $seller, 'customer' => $customer], [
            'seller.legal_name' => ['required', 'string', 'max:255'], 'seller.address' => ['required', 'string', 'max:255'], 'seller.country' => ['required', 'regex:/^[A-Z]{2}$/'],
            'seller.email'      => ['nullable', 'email'], 'customer.display_name' => ['required', 'string', 'max:255'], 'customer.billing_address' => ['required', 'string', 'max:255'], 'customer.billing_country' => ['required', 'regex:/^[A-Z]{2}$/'],
        ], [], [
            'seller.legal_name' => 'company legal name', 'seller.address' => 'company address', 'seller.country' => 'company country code',
            'seller.email'      => 'company billing email', 'customer.display_name' => 'customer name', 'customer.billing_address' => 'customer billing address', 'customer.billing_country' => 'customer country code',
        ])->errors()->all();
        if ($invoice->customer->archived_at !== null) {
            $errors[] = 'Restore the customer before issuing an invoice.';
        }
        if (! in_array($invoice->currency, Currencies::codes(), true)) {
            $errors[] = 'Choose a supported invoice currency.';
        }
        $rules = (new SaveInvoiceRequest)->rules();
        unset($rules['version']);
        $validation = Validator::make($data, $rules);
        $errors     = [...$errors, ...$validation->errors()->all()];
        if (! $validation->fails()) {
            try {
                $calculated = app(InvoiceCalculator::class)->calculate($data);
                foreach (['subtotal_minor', 'discount_minor', 'tax_minor', 'total_minor'] as $field) {
                    if ($calculated[$field] !== $invoice->$field) {
                        $errors[] = 'Totals have changed. Save the draft again before issuing it.';
                    }
                }
                if ($calculated['precision'] !== $invoice->currency_precision) {
                    $errors[] = 'Currency precision changed. Save the draft again.';
                }
                foreach ($invoice->items as $index => $item) {
                    foreach (['gross_minor', 'discount_minor', 'net_minor', 'tax_minor', 'total_minor'] as $field) {
                        if ($calculated['lines'][$index][$field] !== (int) $item->$field) {
                            $errors[] = 'Line totals have changed. Save the draft again.';
                        }
                    }
                    foreach ($item->taxes as $taxIndex => $tax) {
                        if ($calculated['lines'][$index]['taxes'][$taxIndex]['amount_minor'] !== (int) $tax->amount_minor) {
                            $errors[] = 'Tax amounts have changed. Save the draft again.';
                        }
                    }
                }
            } catch (ValidationException $exception) {
                $errors = [...$errors, ...$exception->validator->errors()->all()];
            }
        }
        $logo = null;
        if ($logoId = $seller['logo_media_id'] ?? null) {
            try {
                $logo = $this->logo((int) $logoId);
            } catch (ValidationException $exception) {
                $errors = [...$errors, ...$exception->validator->errors()->all()];
            }
        }
        $data['logo'] = $logo ? 'data:'.$logo['mime'].';base64,'.base64_encode($logo['bytes']) : null;
        $settings     = app(BillingSettings::class);
        $errors       = [...$errors, ...Validator::make(['prefix' => $settings->number_prefix, 'padding' => $settings->number_padding], ['prefix' => ['required', 'string', 'max:20', 'regex:~^[A-Za-z0-9][A-Za-z0-9._/-]*$~'], 'padding' => ['required', 'integer', 'between:1,10']])->errors()->all()];
        $fingerprint  = ['version' => $invoice->version, 'invoice' => $data, 'seller' => $seller, 'customer' => $customer, 'prefix' => $settings->number_prefix, 'padding' => $settings->number_padding, 'logo_hash' => $logo['hash'] ?? null];

        return ['invoice' => $data, 'seller' => $seller, 'customer' => $customer, 'errors' => array_values(array_unique($errors)), 'token' => hash_hmac('sha256', json_encode($fingerprint, JSON_THROW_ON_ERROR), config('app.key')), 'prefix' => $settings->number_prefix, 'padding' => $settings->number_padding, 'logo' => $logo];
    }

    private function logo(int $id): array
    {
        $media = Media::find($id);
        if (! $media || $media->original_media_id !== null) {
            throw ValidationException::withMessages(['logo' => 'Choose an existing original company logo.']);
        }
        try {
            $stream = Storage::disk($media->disk)->readStream($media->getDiskPath());
            if (! is_resource($stream)) {
                throw new \RuntimeException;
            }
            try {
                $bytes = stream_get_contents($stream, 5 * 1024 * 1024 + 1);
            } finally {
                fclose($stream);
            }
            $info       = @getimagesizefromstring($bytes);
            $extensions = ['image/png' => 'png', 'image/jpeg' => 'jpg', 'image/webp' => 'webp'];
            if (! $info || ! isset($extensions[$info['mime']]) || strlen($bytes) > 5 * 1024 * 1024) {
                throw new \RuntimeException;
            }

            return ['bytes' => $bytes, 'hash' => hash('sha256', $bytes), 'mime' => $info['mime'], 'extension' => $extensions[$info['mime']]];
        } catch (\Throwable) {
            throw ValidationException::withMessages(['logo' => 'The logo must be a readable PNG, JPEG or WebP image up to 5 MiB.']);
        }
    }
}
