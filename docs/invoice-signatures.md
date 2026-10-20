# Invoice signatures

In **Billing settings → Invoice settings → Invoice signature**, upload or select the company’s authorized signature, turn on **Show signature on invoices**, and save. PNG, JPEG and WebP originals up to 5 MiB and 20 million pixels are supported; a transparent PNG is recommended. Remove the selected image and save to use a blank signing line. Turn off the switch to omit the entire signature block. Selected media cannot be deleted until removed from settings.

This matches Perfex’s company signature flow (`application/views/admin/settings/includes/pdf.php` and `application/libraries/pdf/PDF_Signature.php`): a current company image, an invoice display switch, and an “Authorized signature” block after the document content. Enabling without an image produces a blank signing line. These are company signatures, not customer acceptance signatures or cryptographic PDF signing.

The setting defaults to disabled and applies to draft previews and existing invoice PDFs, including downloaded, emailed, and customer payment-link PDFs. Changing/removing the image or display setting automatically changes the PDF cache fingerprint. Seller/customer identity and invoice totals remain frozen as before. Credit notes and statements do not include this invoice-only signature setting. An unavailable or corrupted image falls back to a blank signing line.

Deployment: install the latest code, run `php artisan migrate --force`, build frontend assets, and restart queue workers (`php artisan horizon:terminate`). No seeder is required.

An additional repair migration restores `billing.signature_media_id` and `billing.show_signature_on_invoices` on installations missing either setting, even if earlier migrations are already recorded. Run `php artisan migrate --force` during deployment to resolve the `MissingSettings` error when saving company or invoice settings. Only missing entries are added (no image and signatures disabled); existing signatures, visibility preferences and other billing settings are preserved. Rolling back this repair also preserves the settings, which belong to the original signature migration.

## Company branding and address history

Company settings manages the logo, billing identity and timezone. Invoice settings manages numbering, terms and the signature. Each section saves only its own fields; payment methods, online providers, email/SMS configuration, reminders/receipts, taxes and imports have separate destinations.

Draft previews now display the currently selected company logo. Issued invoices with a preserved logo retain that image. Imported invoices without a preserved logo use the current company logo in their PDF and invoice views. This fallback changes branding only: historical imported addresses stay intact. New drafts snapshot the current company address. For existing drafts, select **Use current company details** in the issuance review before issuing.

Online payment settings shows one selectable provider configuration at a time, with a persistent overview of saved Enabled/Disabled status and the Default badge. Editing another provider preserves unsaved fields. The global invoice checkout switch is separate from individual provider enablement.
