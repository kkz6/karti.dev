# Importing a Perfex billing export

Use `billing:import-perfex` to review a private SQL export, then explicitly apply it. `PerfexBillingSeeder` wraps the same importer for deployment. It is intentionally not included in `DatabaseSeeder`.

The reader parses SQL literals; it never executes source SQL. Keep the SQL export and any customer-data files outside Git. The imported archive is encrypted with the destination application's `APP_KEY`; retain that key with database backups.

## What becomes native data

- Customers, contacts, primary-contact selection, invoice-email preferences and active/archive flags.
- Invoices, original numbers, issue/due dates, issuer and billing details, line items, discounts, taxes, notes and terms.
- Payments with original dates, methods, transaction references and notes.
- Invoice activity with source actor names and timestamps; source staff are not given local accounts.
- Tax definitions and catalogue rates, with a separate service per supported source currency.

Each native record has a stable source-ID mapping. A repeat run is a no-op. Changed source data, missing mapped records and unsupported financial differences stop the import. Historical invoice numbers are preserved even when they repeat; source IDs and destination invoice IDs distinguish the records. This is a one-time historical migration with repeat protection, not ongoing synchronization.

## Historical details retained in the platform

The encrypted import batch also holds the source business records and destination-ID mappings. From **Billing settings → Imports → the imported batch**, choose **Download imported source records**. This requires billing-import permission.

The archive retains extra customer fields, original HTML, shipping information, contact preferences, invoice/payment metadata, customer notes, sales activity, email-open/view tracking, billing notifications, catalogue references, expenses and task information. Email tracking is historical evidence, not a new delivery queue. Expenses and tasks remain archive records because this application does not currently have native modules for them.

Passwords, login/reset/verification secrets, invoice access tokens, tracking tokens, staff credentials, API credentials, session data and unrelated application tables are excluded. Only billing-identity and numbering settings are retained. Original portal links are not reactivated. Counts of excluded rows and tables are included in the report.

There are important source limitations:

- Perfex exports current company/customer identity, not immutable historical identity snapshots. The importer cannot recover earlier names or addresses that are absent from the export. Original invoice billing blanks remain blank.
- Customer billing fields fall back to general address fields. Perfex has no customer-type field in this schema, so imported customers start as Business; original fields remain in the archive.
- Source creation timestamps are used for issuance. Cancellation timestamps come from cancellation activity; they stay empty when that activity is absent. Inactive records use import time as their archive time, since the source has no archive timestamp.
- Descriptions/notes are converted from HTML to readable text in native records; original HTML is retained in the archive.
- Imported invoices start with automated reminders paused. No email, portal account, payment request or recurring schedule is created.
- The next invoice sequence is advanced beyond the highest imported numeric sequence, even when the source's configured next number is lower. Existing larger destination sequences are retained.

## Review and apply

Run the destination schema migrations first, using the normal deployment process. The migration enlarges encrypted archive storage for MySQL as well as SQLite.

```bash
php artisan migrate --force
php artisan billing:import-perfex /private/path/perfex.sql \
  --source=legacy-crm \
  --report=/private/path/import-review.json
```

This is read-only and returns a nonzero exit code if validation fails. Reports contain counts and reconciliation information; they do not contain customer names or contact details. Report files are created with owner-only permissions and never overwrite an existing file.

The importer requires exact agreement between source and calculated line/subtotal/discount/tax/total amounts and between source status and payment sums. Currency arithmetic uses decimal/minor-unit values, including zero-decimal JPY. Adjustments, overpayments, recurring schedules, credit ledgers and other unsupported financial entities stop the import instead of being silently dropped. Attachments require a separate files migration and also stop the adapter when present.

## Repeated historical invoice numbers

Perfex may contain different invoices with the same displayed number. These are imported as separate records with their **original, unchanged number**. Payments, line items, activity, links and PDF storage use invoice IDs, so the histories remain independent. Existing destination invoices with matching numbers are also left unchanged; a review warning identifies the overlap.

The database keeps a private number scope for imported source records. Native invoices retain a shared unique-number constraint, and issuance refuses a number already used by a historical invoice. A rollback to globally unique numbers is blocked while duplicates exist, without renaming or deleting any invoices.

Always rerun using the same source name. Changing it means a different source system and can intentionally create distinct records with matching displayed numbers. No number override file or cancellation suffix is needed.

Once the review passes, apply it with an existing user who has `import billing data` permission:

```bash
php artisan billing:import-perfex /private/path/perfex.sql \
  --source=legacy-crm \
  --actor=1 --apply
```

Replace `1` with the intended local user's ID. Apply rechecks conflicts inside a transaction, locks invoice numbering, and rolls everything back if any insert fails. It never deletes or replaces destination data. Demonstration records do not need to be deleted to accommodate matching historical numbers.

The equivalent seeder invocation is:

```bash
PERFEX_SQL_PATH=/private/path/perfex.sql \
PERFEX_IMPORT_SOURCE=legacy-crm \
PERFEX_IMPORT_ACTOR=1 \
php artisan db:seed --class=PerfexBillingSeeder --force
```

These are process environment variables, so the seeder also works with Laravel's configuration cache enabled. Always use the same source name on reruns.

## Verification

```bash
vendor/bin/pest modules/billing/tests/Unit/PerfexSqlReaderTest.php \
  modules/billing/tests/Feature/PerfexBillingImportTest.php \
  modules/billing/tests/Feature/BillingImportsTest.php
```

The tests cover SQL literal parsing, financial rejection, referential mapping, credentials exclusion, encrypted archive storage/download permissions, idempotency, preservation of repeated historical numbers, prevention of duplicate native issuance, HTML conversion and transaction rollback. Tests use synthetic data only.

For a real-export rehearsal, point a separate application process at a fresh temporary database, migrate it, and run the importer twice. Compare native row counts, line totals and payment sums with the review report; confirm no mail/jobs were dispatched. Do not use `migrate:fresh` against the application database.
