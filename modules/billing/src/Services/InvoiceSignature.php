<?php

namespace Modules\Billing\Services;

use Modules\Billing\Settings\BillingSettings;
use Modules\Media\Models\Media;

class InvoiceSignature
{
    /** Like Perfex, signatures use current PDF settings, including on existing invoices. */
    public function data(): array
    {
        $settings = app(BillingSettings::class);
        if (! $settings->show_signature_on_invoices) {
            return ['enabled' => false, 'image' => null];
        }
        $media = $settings->signature_media_id ? Media::find($settings->signature_media_id) : null;

        return ['enabled' => true, 'image' => $media ? app(BillingBrandingImage::class)->image($media) : null];
    }
}
