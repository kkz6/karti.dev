# Customer and Billing Implementation Reference for karti.dev

Build customer and invoice management inside karti.dev for one issuing business. Use the supplied Perfex installation to understand useful workflows, and implement them using karti.dev's Laravel, React and Inertia architecture. Each implementation stage below is intended to be a separate, reviewable task.

Reference date: 11 October 2026. Current status: Stages 1 through 12 implemented with local verification; production configuration and real external-provider acceptance remain deployment steps.

## 1 Purpose and working boundaries

The primary workflow is:

1. Create a customer and their billing contact.
2. Create a draft invoice for services.
3. Issue the invoice with a permanent number and frozen billing details.
4. Generate and send a branded PDF.
5. Record payments and show the remaining balance.
6. Review customer history and follow up on unpaid invoices.

The business issuing invoices is a single company. Customer records may represent multiple businesses or individuals. Do not confuse those customers with application tenants.

In the supplied Perfex schema, `tblclients.company` names a customer business, `tblinvoices.clientid` identifies the customer, and global `tbloptions` entries hold the issuing company's details and next invoice number. The inspected customer and invoice tables do not carry a tenant identifier. No company switching or tenant isolation layer is required by this project.

### Included in the first release

- Customers, billing addresses, tax identifiers and contacts.
- Reusable service descriptions and prices.
- Draft invoices, issuance, numbering, discounts and configurable item taxes.
- Manual payments, partial payments, balances and payment history.
- PDF generation, invoice email and delivery records.
- Customer invoice history and basic totals by currency.
- Administrator permissions and an invoice activity history.

### Subsequent stages

- Private invoice viewing links without customer accounts.
- Due and overdue reminders.
- Optional imports from Perfex if existing business data must be transferred.
- Verified online payments and consultation booking integration.
- Recurring invoices, account statements and credit notes.

### Excluded unless the user changes scope

Lead management, sales pipelines, proposals, estimates, support tickets, task and time tracking, CRM project management, expenses, contracts, subscriptions, staff commission, customer self-registration, a complete customer portal, arbitrary custom fields, and tenant management.

Shipping addresses are excluded initially because the proposed workflow invoices services. Add them only if a real billing requirement emerges.

## 2 How an AI should use this reference

The roots used throughout this guide are:

| Root   | Absolute location               |
| ------ | ------------------------------- |
| Karti  | `/Users/kk/projects/karti.dev`  |
| Perfex | `/Users/kk/projects/perfex_crm` |

Paths in source tables are relative to the named root. These locations describe existing reference files. Proposed paths are explicitly labelled and may not exist yet. Locate functions by their names rather than assuming line numbers will stay valid.

Before each implementation task:

1. Read this document, applicable `AGENTS.md` instructions, the requested stage and current worktree changes.
2. Read the listed Perfex functions and their immediate callers to understand the behavior. A helper name alone is not evidence that invoices use it.
3. Read the corresponding Karti files to preserve local conventions.
4. Check which proposed structures already exist and extend them rather than creating duplicates.
5. Implement the authorized stage and its necessary dependencies. Do not automatically build later stages.
6. Test business behavior, permissions and failure paths appropriate to the change.
7. Update the progress ledger and decisions in this document with the actual implementation, test results and remaining work.

Treat Perfex as reference material. Its controllers, SQL schema, jQuery screens, hook system and application helpers are coupled to its framework. Do not place a second Perfex application inside Karti or import the entire database schema.

Use the shared shadcn UI components throughout billing screens. Reuse Button, Input, Textarea, Label, Select, Checkbox, Card, Alert, AlertDialog and the shared date fields. Do not introduce visible native dropdowns, native checkboxes or `window.confirm` prompts. The billing Select and confirmation helpers described in the Stage 3 entry preserve these conventions. Low-level hidden controls owned by the shared primitives/upload components remain implementation details.

Do not assume permission to redistribute Perfex application source from the license of its underlying framework or third-party dependencies. Karti's root license is MIT; the inspected Perfex folder did not establish an application-wide redistribution license. Write native implementations. Check the applicable source license before any direct source or template copying.

Never read or publish environment secrets, payment credentials, uploaded customer documents or real customer data merely to complete this reference workflow. Schema and application code are sufficient for the initial implementation.

The user's commit identity is `kkz6 <karthickk1996@hotmail.com>`. Before a requested commit, check the effective Git author and committer identity and correct conflicting repository-specific settings.

## 3 Architecture findings from the current code

| Area                  | Verified source observation                                                                                                                                       | Implementation consequence                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Perfex framework      | `system/core/CodeIgniter.php` declares CodeIgniter 3.1.11. Models extend `App_Model` and use `$this->db`, loaders, global helpers and hooks.                      | Rebuild selected behavior with Laravel models, requests, policies and services.                  |
| Karti framework       | Root `composer.json` requires Laravel 12, Inertia 2 and modular packages. `package.json` includes React 19 and TypeScript.                                        | Use the existing backend and frontend stack.                                                     |
| Karti modules         | Root Composer uses `modules/*` path repositories. Existing modules have namespaces and provider discovery in their own Composer manifests.                        | Add a `modules/billing` package and root requirement using the current module pattern.           |
| Module pages          | `resources/js/app.tsx` resolves `module::page` names from `modules/*/resources/js/pages/**/*.tsx`.                                                                | Render proposed pages as `billing::customers/index`, etc.; verify SSR resolution too.            |
| Settings              | `config/settings.php` explicitly lists setting classes; automatic settings discovery is empty.                                                                    | Register billing settings explicitly and initialize their values through migrations.             |
| Permissions           | `Modules\Shared\Policies\BasePolicy` uses Spatie permissions and grants the `super-admin` role access.                                                            | Add policies and verify permission provisioning; route authentication alone is insufficient.     |
| Portfolio projects    | `modules/projects/src/Models/Project.php` has publishing fields and a text `client` field.                                                                        | Do not treat portfolio entries as billable projects or expose customer billing details publicly. |
| Consultation bookings | The booking model stores name, email, payment ID and booking status. The inspected return handler calls `markConfirmed()` without checking payment success there. | Verify provider payment status before integrating automatic payment or invoice creation.         |

This is a source inspection baseline. Production database contents, enabled Perfex options, hosting setup and runtime behavior must be checked separately if they affect a later task.

## 4 Perfex source map

### 4.1 Customer records and contacts

| Perfex file                                          | What to inspect                                                                                                                    | What to take into Karti                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `install/database.sql`                               | `tblclients` and `tblcontacts`; relationship through contact `userid`; billing fields, active flags and invoice email preferences. | Separate customer identity from contact people; keep billing data and invoice recipients. |
| `application/models/Clients_model.php`               | `get`, `get_contacts`, `get_contact`, `add`, `update`, `add_contact`, `update_contact`.                                            | Customer/contact CRUD behavior and primary contact handling.                              |
| `application/models/Clients_model.php`               | `get_customer_default_currency`, `get_customer_billing_and_shipping_details`, `change_client_status`, `delete`, `delete_contact`.  | Default selection, archive semantics and consequences of deleting customers with history. |
| `application/controllers/admin/Clients.php`          | Form input handling, customer views, contact operations and access checks.                                                         | Workflow order and validations; replace Perfex checks with Laravel policies.              |
| `application/views/admin/clients/client.php`         | Customer page assembly and related sections.                                                                                       | A focused customer page with overview, contacts, invoices and payments.                   |
| `application/views/admin/clients/groups/profile.php` | Customer and billing address fields.                                                                                               | Decide which fields the service business actually needs.                                  |
| `application/views/admin/clients/modals/contact.php` | Contact name, email, primary contact and notification fields.                                                                      | Billing recipient editing; omit portal credentials and unrelated notifications.           |
| `application/libraries/import/Import_customers.php`  | Field mapping, row processing and validation.                                                                                      | Later import reference only; do not inherit portal accounts or passwords.                 |

Omit lead conversion, customer staff assignment, vault entries, portal authentication and project/ticket notification settings. Keep customers as business records distinct from Karti administrator users.

### 4.2 Invoice creation and lifecycle

| Perfex file                                             | What to inspect                                                                                                                   | What to take into Karti                                                                                       |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `install/database.sql`                                  | `tblinvoices`, `tblitemable`, `tblitem_tax`, `tblitems`, `tblcurrencies` and `tbltaxes`.                                          | Relationships, stored addresses, prices and tax snapshots. Use dedicated invoice item tables.                 |
| `application/models/Invoices_model.php`                 | Status constants; `get`, `add`, `update`, `copy`, `mark_as_cancelled`, `unmark_as_cancelled`, `delete`.                           | Draft, issued, paid, partial, overdue and cancelled behaviors, with explicit transitions.                     |
| `application/models/Invoices_model.php`                 | `change_invoice_number_when_status_draft`, `save_formatted_number`, `increment_next_number`, `decrement_next_number`.             | Understand Perfex numbering; replace it with a transaction-safe allocator that never recycles issued numbers. |
| `application/models/Invoices_model.php`                 | `get_invoice_activity`, `log_invoice_activity`, `set_invoice_sent`.                                                               | Record who changed or sent an invoice and when.                                                               |
| `application/controllers/admin/Invoices.php`            | Create/edit request flow, item lookup, send operations, duplication and permissions.                                              | Map the UI actions to small backend operations.                                                               |
| `application/views/admin/invoices/invoice.php`          | Invoice editor structure.                                                                                                         | Customer selection, date controls, service lines, totals and explicit actions.                                |
| `application/views/admin/invoices/invoice_template.php` | Invoice detail presentation and action controls.                                                                                  | Separate editing a draft from viewing an issued invoice.                                                      |
| `application/views/admin/tables/invoices.php`           | Filters, columns and status presentation.                                                                                         | Search by customer/number; filters for dates, currency, lifecycle and payment state.                          |
| `application/helpers/invoices_helper.php`               | `format_invoice_number`, `update_invoice_status`, `is_invoice_overdue`, `get_invoice_total_left_to_pay`.                          | Number formatting and balance/status rules; account for future credits separately.                            |
| `application/helpers/sales_helper.php`                  | `sales_number_format`, `get_items_by_type`, `add_new_sales_item_post`, `update_sales_item_post`, `update_sales_total_tax_column`. | Item persistence, tax relationships and formatting.                                                           |

Read how `Invoices_model::add()` extracts submitted items and uses incoming totals before deciding what to reuse. Karti must compute persisted totals on the server even if Perfex's editor submits calculated totals.

### 4.3 Calculations and service catalogue

| Perfex file                                       | What to inspect                                                                                         | Implementation guidance                                                                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `assets/js/main.js`                               | `calculate_total`, `exclude_tax_from_amount`, `format_money`, and item addition/reordering code nearby. | Understand invoice preview math, tax grouping, discounts and adjustment display. React replaces this jQuery implementation.                                                                          |
| `application/helpers/sales_helper.php`            | `calculate_sales_total`, `get_decimal_places`, `app_format_money`.                                      | Understand alternative calculation behavior and rounding. In the inspected source, calls to `calculate_sales_total` were found in `Estimate.php` and `Proposal.php`; do not assume invoices call it. |
| `application/models/Invoice_items_model.php`      | `get`, `get_grouped`, `add`, `edit`, `search`, `delete`.                                                | Reusable service descriptions, units, prices and tax defaults.                                                                                                                                       |
| `application/controllers/admin/Invoice_items.php` | Catalogue editing and searches.                                                                         | Simple service catalogue and lookup for invoice lines.                                                                                                                                               |
| `application/models/Taxes_model.php`              | Tax definition operations.                                                                              | Named percentage presets; freeze applied names and rates on each invoice.                                                                                                                            |
| `application/models/Currencies_model.php`         | Currency definitions and base currency selection.                                                       | Currency metadata; one currency per invoice and no cross-currency arithmetic.                                                                                                                        |

The reference calculation uses PHP numeric multiplication and rounding. Native billing must choose a decimal-safe implementation and an explicit rounding policy. Do not copy float arithmetic or the legacy `TAXNAME|RATE` encoding into new domain objects.

### 4.4 Payments and balances

| Perfex file                                                                                     | What to inspect                                                           | What to take into Karti                                                                |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `application/models/Payments_model.php`                                                         | `get`, `get_invoice_payments`, `add`, `update`, `delete`.                 | Separate payment entries from invoices; recalculate balances after changes.            |
| `application/models/Payments_model.php`                                                         | `process_payment`, `transaction_exists`, `send_invoice_payment_recorded`. | Payment provider boundaries, duplicate transaction handling and receipt notifications. |
| `application/models/Payment_modes_model.php`                                                    | Available payment methods and descriptions.                               | Manual bank transfer, cash or another configured method; invoice payment instructions. |
| `application/controllers/admin/Payments.php`                                                    | Payment entry and detail workflow.                                        | Amount, date, method, reference and internal note.                                     |
| `application/views/admin/payments/manage.php` and `application/views/admin/tables/payments.php` | Payment listing and presentation.                                         | Filterable payment history.                                                            |
| `application/helpers/invoices_helper.php`                                                       | `get_invoice_total_left_to_pay`, `update_invoice_status`.                 | Outstanding amount and partial/full settlement.                                        |
| `application/views/themes/perfex/views/paymentpdf.php`                                          | Receipt presentation.                                                     | Optional native receipt template after invoice PDF delivery works.                     |

Prefer auditable reversal of an incorrect payment over silently deleting it. Manual payment entry needs no payment provider integration.

### 4.5 PDFs and email

| Perfex file                                                   | What to inspect                                                        | What to take into Karti                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `application/libraries/pdf/Invoice_pdf.php`                   | `prepare`, `file_path`, `get_payment_modes`, constructor dependencies. | Data needed for the invoice PDF and payment instructions.                   |
| `application/libraries/pdf/App_pdf.php`                       | Shared rendering setup, branding, fonts and page configuration.        | Rendering requirements; implement through a Laravel-compatible PDF adapter. |
| `application/views/themes/perfex/views/invoicepdf.php`        | Header, parties, line items, totals, terms and pagination.             | Information hierarchy; build an original Blade template.                    |
| `application/models/Invoices_model.php`                       | `send_invoice_to_client`, `set_invoice_sent`.                          | Recipient selection, attachments, delivery and sent timestamps.             |
| `application/libraries/mails/Invoice_send_to_customer.php`    | Invoice email template wrapper.                                        | A focused native Mailable.                                                  |
| `application/libraries/merge_fields/Invoice_merge_fields.php` | Invoice number, dates, totals and link values.                         | Typed email data rather than a generic template engine.                     |
| `application/views/admin/invoices/invoice_send_to_client.php` | Recipient selection and send options.                                  | Explicit send action and recipient review.                                  |

Perfex uses TCPDF through its application wrapper. Karti's inspected root dependencies do not include a dedicated invoice PDF renderer. Choose the renderer at the PDF stage, check current official documentation then, and keep rendering behind an interface. Do not copy Perfex's vendor directory.

### 4.6 Public links and reminders

| Perfex file                                                   | What to inspect                                           | Implementation guidance                                                             |
| ------------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `application/controllers/Invoice.php`                         | `index`, PDF download and payment actions.                | A minimal invoice view without full customer login.                                 |
| `application/helpers/invoices_helper.php`                     | `check_invoice_restrictions`, reminder option helpers.    | Understand ID/hash authorization, then implement revocable native access.           |
| `application/models/Invoices_model.php`                       | `send_invoice_due_notice`, `send_invoice_overdue_notice`. | Reminder content and recorded send dates.                                           |
| `application/models/Cron_model.php`                           | `invoice_due`, `invoice_overdue`, `recurring_invoices`.   | Eligibility, scheduling and recurrence; Laravel scheduling replaces the cron model. |
| `application/views/admin/settings/includes/invoices.php`      | Invoice defaults and reminder options.                    | Choose a small subset of settings.                                                  |
| `application/views/admin/settings/includes/sales_general.php` | Shared number/currency formatting defaults.               | Keep presentation separate from accounting rules.                                   |

### 4.7 Later accounting and imports

- `application/models/Statement_model.php`: inspect `get_statement` and `send_statement_to_email` for opening balance, period transactions and closing balance.
- `application/views/themes/perfex/views/statementpdf.php`: inspect layout after statement arithmetic is defined.
- `application/models/Credit_notes_model.php`: inspect `credit_note_from_invoice`, `apply_credits`, `get_applied_invoice_credits`, refund operations and remaining-credit calculations. These are separate ledger concerns, not negative manual payments.
- `modules/exports/services/CustomerCSVExport.php`, `ContactCSVExport.php`, `PaymentCSVExport.php`: inspect export shapes if transferring existing records.
- `modules/einvoice/src/Data/Invoice.php`, `Company.php`, `Customer.php`, `Item.php`: inspect structured export data only when electronic invoice exports are requested. This module's presence does not establish suitability for a particular jurisdiction.

## 5 Karti source map

| Karti file                                                                                                                   | What to inspect and reuse                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `composer.json`, `config/app-modules.php`                                                                                    | Path packages, requirements, module namespace and directory conventions.                                                               |
| `modules/projects/composer.json`                                                                                             | Package manifest and service provider discovery.                                                                                       |
| `modules/projects/src/Providers/ProjectsServiceProvider.php`                                                                 | Explicit route and migration registration. Avoid double-loading resources if automatic discovery also applies.                         |
| `modules/projects/routes/projects-routes.php`                                                                                | Admin prefix and web/auth/verified middleware pattern. Add billing-specific policy checks.                                             |
| `modules/projects/src/Http/Controllers/AdminProjectController.php`                                                           | Inertia list/create/edit responses and redirect messages. Use dedicated requests for financial validation.                             |
| `modules/frontend/src/Tables/ContactSubmissions.php`                                                                         | Searchable columns, filters, status badges and actions.                                                                                |
| `modules/table/src/Table.php`, `modules/table/src/Exporter.php`                                                              | Table lifecycle and export behavior; enforce authorization on direct export and action endpoints.                                      |
| `modules/projects/resources/js/pages/index.tsx`, `create.tsx`, `edit.tsx`                                                    | Page layout, form controls, errors and breadcrumbs. Omit portfolio SEO/publishing fields.                                              |
| `modules/shared/resources/js/components/page-container.tsx`                                                                  | Consistent page widths and spacing.                                                                                                    |
| `modules/shared/resources/js/components/date-field.tsx`                                                                      | Date-only input handling.                                                                                                              |
| `modules/shared/resources/js/components/unsaved-changes-guard.tsx`                                                           | Protection for customer and invoice draft edits.                                                                                       |
| `modules/shared/resources/js/config/navigation.ts`                                                                           | Add a Business navigation group and Billing settings link when their routes exist.                                                     |
| `resources/js/app.tsx`, `resources/js/ssr.tsx`                                                                               | Module page resolution and SSR compatibility.                                                                                          |
| `vite.config.ts`, `tsconfig.json`                                                                                            | Module aliases and frontend build inputs; check before adding `@billing`.                                                              |
| `modules/shared/src/Policies/BasePolicy.php`, `modules/auth/src/Models/User.php`                                             | Permission names, roles and administrator behavior.                                                                                    |
| `modules/settings/src/Settings/EmailSettings.php`, `SiteSettings.php`                                                        | Typed settings patterns. Billing identity should remain separate from website identity.                                                |
| `modules/settings/src/Http/Controllers/EmailSettingsController.php`                                                          | Settings forms, validation and email test workflow.                                                                                    |
| `modules/settings/src/Support/EmailConfiguration.php`, `modules/settings/src/Http/Middleware/ApplyEmailSettings.php`         | How configured mail transport is applied. Verify queued workers use the same settings; request middleware does not execute in workers. |
| `config/settings.php`, `modules/settings/database/migrations/2026_09_21_070000_initialize_email_settings.php`                | Explicit settings registration and initialization pattern.                                                                             |
| `modules/frontend/src/Providers/FrontendServiceProvider.php`                                                                 | Scheduled command registration.                                                                                                        |
| `modules/frontend/src/Mail/NewContactSubmission.php`, `modules/frontend/src/Listeners/SendContactSubmissionNotification.php` | Native mail and event handling patterns.                                                                                               |
| `modules/frontend/src/Models/ConsultationBooking.php`, `modules/frontend/src/Http/Controllers/BookingsController.php`        | Existing checkout/booking integration and payment verification gap.                                                                    |
| `tests/Pest.php`, `phpunit.xml`, `modules/frontend/tests/Feature/ContactFormTest.php`                                        | Module test discovery, database reset, HTTP/mail/event fakes and Inertia assertions.                                                   |

Do not reuse generic trash actions for issued invoices. Customer archives, deletable drafts, cancelled invoices and reversed payments have different business meanings.

## 6 Proposed module and ownership

Proposed package: `modules/billing`, namespace `Modules\Billing`, Composer name `modules/billing`.

```text
modules/billing/
  composer.json
  src/
    Providers/BillingServiceProvider.php
    Models/
    Enums/
    Http/Controllers/
    Http/Requests/
    Policies/
    Actions/
    Services/
    Settings/BillingSettings.php
    Tables/
    Mail/
    Jobs/
    Console/Commands/
  routes/billing-routes.php
  database/migrations/
  database/factories/
  resources/js/pages/customers/
  resources/js/pages/invoices/
  resources/js/pages/payments/
  resources/js/pages/services/
  resources/js/components/
  resources/views/pdf/
  resources/views/mail/
  tests/Unit/
  tests/Feature/
```

Create folders as needed by the active stage. Avoid empty layers and interfaces for simple CRUD. Use explicit operations for issuance, payment recording, sending and recurrence because they coordinate transactions and side effects.

Suggested operations: `CalculateInvoiceTotals`, `IssueInvoice`, `RecordPayment`, `ReversePayment`, `CancelInvoice`, `SendInvoice`, `GenerateInvoicePdf`. Names are proposals, not existing APIs.

The billing module owns financial records, settings, templates and jobs. Shared/table/auth modules remain reusable infrastructure. The frontend module can later dispatch a verified booking payment event; billing decides how that event maps to its records.

## 7 Proposed data model

Names below are proposed. Prefer `billing_` table prefixes to distinguish financial tables from generic names and existing modules.

### Customers

`billing_customers`: ID; type (`individual` or `business`); display name; business/legal name where applicable; phone; website; tax identifier; billing address fields; country code; default currency; internal notes; archived timestamp; created/updated timestamps; optional creating administrator.

Use `billing_contacts` for contact name, email, phone, customer ID, primary flag, invoice email preference and archived timestamp. An individual still has a billing contact. Do not create administrator accounts for customer contacts. Do not enforce globally unique contact email: the same accountant may serve several customers. Normalize email consistently for lookup without automatically merging distinct customers.

Enforce at most one active primary contact per customer in a transaction. Archive referenced customers; block destructive deletion when financial history exists.

### Services and taxes

`billing_services`: ID, name, description, unit, default rate, rate currency, active/archive state and timestamps. If the service currency differs from the invoice currency, require an explicit price instead of assuming a conversion.

`billing_tax_rates`: ID, label, percentage, active flag and timestamps. Multiple additive taxes per line can be supported without introducing automatic jurisdiction rules. Record the actual applied label and percentage on invoice lines. Editing a preset must not rewrite issued invoices.

### Invoices and lines

`billing_invoices`: ID; customer ID; lifecycle (`draft`, `issued`, `cancelled`); invoice date; due date; currency code and precision; number/sequence data; formatted number; seller snapshot; customer snapshot; recipient snapshot; subtotal; discount mode/value/amount; tax amount; total; customer note; internal note; terms; payment instruction snapshot; issued/cancelled timestamps; cancellation reason; created/updated timestamps and actor references.

Snapshots may use structured JSON or dedicated columns, provided they are validated and stable. Freeze issuer identity, customer legal identity, address, contact recipients, currency precision, service descriptions, quantities, rates and taxes at issuance. A later settings or customer update must not alter an issued document.

`billing_invoice_items`: invoice ID, optional catalogue service ID, position, description, additional description, unit, quantity, rate, computed line subtotal and other computed amounts needed to reproduce the invoice.

`billing_invoice_item_taxes`: item ID, applied name, percentage and computed amount. References to presets are optional; snapshots are authoritative.

### Payments and activity

`billing_payments`: invoice ID, positive amount, matching invoice currency, payment date, method, reference, internal note, recorded timestamp and actor; reversal timestamp/reason/actor or a linked reversal record. Optional provider and provider payment ID arrive with the online payment stage.

`billing_invoice_activities`: invoice ID, event type, actor or system source, timestamp, safe structured details. Include draft creation, issuance, cancellation, payment/reversal and send outcomes. Do not store credentials or raw provider payloads indiscriminately.

`billing_invoice_deliveries`: invoice ID, recipient snapshot, request/idempotency identity, queued/accepted/failed status, timestamps, provider message reference if available and safe error details. Mail transport acceptance is not proof of delivery to the recipient's inbox.

`billing_invoice_sequences`: sequence scope, next number and timestamps. Keep mutable counters outside general company settings so they can be locked atomically.

### Optional tables by later stage

Private link tokens, reminder attempts, recurring schedules, provider webhook receipts, import ID mappings and credit note records. Add them when their workflows are implemented.

Use database constraints and explicit indexes for invoice numbers, foreign keys, customer lookups, due dates and provider identities. Store country codes and currency codes deliberately rather than copying Perfex integer IDs. Verify behavior on the actual deployment database; SQLite tests cannot prove MySQL/PostgreSQL locking behavior.

## 8 Billing rules to settle before invoice implementation

### Currency and arithmetic

- One currency per invoice; payments use that currency. Do not add INR and USD into a single dashboard total.
- Use decimal-safe arithmetic, such as a vetted decimal library or integer minor units with explicit higher-precision quantity/rate calculations. Select and document the approach in Stage 3; do not assume ordinary PHP floats are sufficient.
- Currency precision is metadata; avoid hardcoding two decimals for every future currency.
- Proposed initial quantity precision is four decimal places. Validate positive quantity and nonnegative rate, and define amount/quantity limits to prevent overflow.
- Store authoritative computed totals; reject or ignore caller-supplied totals. UI calculations are previews.
- Proposed first-release discounts are one invoice-wide fixed or percentage discount before tax. After-tax discounts, tax-inclusive prices, compound taxes and arbitrary adjustments are deferred unless explicitly needed.
- Allocate a fixed discount proportionally across eligible lines with deterministic handling of rounding residuals. Sum rounded line tax amounts by tax label/rate. Document the exact policy and use the same output in the screen, PDF, email and balances.
- Reject discounts greater than the subtotal and percentages outside 0–100. Handle zero subtotals without division by zero.

Acceptance fixture: two units at 1,000 and one unit at 500 yield subtotal 2,500. A 10% before-tax discount yields 250 discount and taxable base 2,250. An illustrative configured 18% tax yields 405 tax and total 2,655. A payment of 1,000 leaves 1,655; a further 1,655 settles it. This is an arithmetic example, not a tax rule.

Additional fixtures must include mixed tax rates, untaxed lines, fractional quantities, a one-minor-unit rounding residual, 100% discount, zero-priced lines and unsupported currencies.

### Lifecycle and settlement

Separate lifecycle from derived payment state:

| Condition                                        | Display meaning                                                                         |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Draft                                            | Editable; no permanent invoice number; cannot accept a payment or send a final invoice. |
| Issued with no payments                          | Unpaid.                                                                                 |
| Issued with some payments and a positive balance | Partially paid.                                                                         |
| Issued with zero remaining balance               | Paid or settled.                                                                        |
| Issued with a positive balance after due date    | Overdue, while preserving partial-payment information.                                  |
| Cancelled                                        | Excluded from collectible balances; number retained.                                    |

Track email state separately. An invoice is not paid because it was sent, and it is not issued merely because an email job was queued. An invoice becomes overdue after its due date in the configured business timezone; the due date itself is not overdue. Use date-only fields for invoice/payment/due dates and UTC timestamps for events.

After issuance, block edits to financial amounts and document identity. Internal notes may change with audit history. Before credit notes exist, allow cancellation only when there are no active payments; corrections require a new invoice. Do not silently implement refunds or edits to paid invoices.

A zero-total issued invoice is settled without a fake payment. Reject zero/negative manual payments and overpayments initially. Payment recording must lock/recheck the remaining balance so simultaneous submissions cannot overpay. Reverse incorrect payments with an explanation, then recompute state.

### Number allocation

Drafts use their internal IDs. Allocate a permanent number during explicit issuance. A proposed display format is `INV-000001`; preserve the configured prefix and padding in the issued record. Annual or financial-year reset is a decision to confirm before enabling it, not an implied feature.

Lock the sequence row, reserve/increment the number, freeze snapshots, persist issuance and record activity in one database transaction. Add a uniqueness constraint and retry only well-defined conflicts. A repeated issue request must return the existing issued invoice instead of consuming another number. Cancelled numbers remain used. Do not decrement a sequence to reuse a number.

## 9 Security and operational requirements

### Administrator access

Apply policies to every customer/invoice/payment/service action, including table exports and bulk/direct endpoints. Use existing permission naming conventions and add explicit abilities for issuance, sending, cancellation, recording and reversal. Verify the current project's role provisioning rather than inventing an automatic grant to every authenticated user.

Customer/contact email, tax details, notes and invoice records are private. Public portfolio props, analytics, search indexes and public media pages must not expose them. Keep financial PDFs in private storage with authorized downloads.

### Private invoice links

Use an opaque, high-entropy revocable token stored as a hash, or a signed route with a documented revocation/version strategy. Possession grants read access to one invoice only. Enforce the same authorization for PDF downloads. Reject draft invoices and invalid/revoked links; define cancelled-invoice display deliberately. Remove internal notes, activity actors, other invoices and unrelated customer details from public props. Add appropriate cache and indexing controls.

### Queues and email

Queue email after the financial transaction commits. Explicit sends need an idempotency identity: job retries must not accidentally duplicate the same send, while a deliberate resend must remain possible. Preserve selected recipients for each attempt. Resolve configured email transport in queue workers, not only HTTP middleware.

Freeze the issued invoice document; if showing current settlement separately, do not silently rewrite the original issued PDF. Handle renderer failures, private storage failures and mail failures independently. A failed send leaves an invoice issued and recoverable. Distinguish transport acceptance from confirmed inbox delivery.

### Online payments

Before Stage 10, verify current official provider documentation for webhook signatures, transaction retrieval, event identifiers and supported checkout behavior. The existing Dodo dependency does not establish support for arbitrary invoice payments or every billing use case.

Validate payment authenticity, successful state, amount, currency and invoice association. Deduplicate provider events and payment IDs using database constraints and transaction logic. Handle pending/failed events, retries and out-of-order delivery. A browser return URL or caller-supplied payment ID is not proof of payment.

## 10 Build stages and acceptance criteria

The proposed order provides manual billing first and adds automation after core records are reliable. Each stage should leave a usable, tested increment. The stage prompts in Section 13 authorize only the selected stage.

### Stage 1 Module foundation and customer management

Read Perfex customer references in Section 4.1. Read Karti module, routing, table, policy, page and navigation references in Section 5.

Build the billing package, migrations/factories, customer/contact models, validation requests, policies, table, index/create/edit/detail pages and a Customers navigation entry. Establish how authorized administrators receive access. Add archive/restore behavior and enforce the primary contact invariant. Invoice tabs may be omitted until invoice records exist; do not show fabricated balances.

Acceptance: an authorized administrator can create a business or individual, edit billing details, manage contacts, search/filter customers and archive/restore them. Invalid input is rejected. Unauthorized reads/writes/exports fail. Archiving keeps history and prevents selecting the customer for new invoices by default.

Tests: CRUD validation, authorization, primary-contact replacement, duplicate email across different customers, archive behavior and table access. Run relevant frontend type/build checks for added pages.

### Stage 2 Company billing settings and service catalogue

Read Perfex invoice/settings/catalogue references and Karti settings registration, migration and controller patterns.

Build separate issuer settings: legal/display name, address, tax ID, logo reference, business timezone, default currency, due interval, number prefix/padding, default terms and payment instructions. Initialize empty identity fields so issuance can later require valid company details. Do not invent a legal company name or tax registration. Add service CRUD and named tax presets, including currency on catalogue prices.

Acceptance: settings persist, services can be searched/archived, tax presets are selectable, and billing identity changes do not change website identity. No public props reveal payment credentials or private settings.

Tests: settings initialization/save/validation, permission checks, catalogue currency behavior and archived service lookup. Choose a default currency explicitly before real invoice issuance; INR is a suggested initial configuration, not an inferred legal requirement.

### Stage 3 Invoice calculations and draft editor

Read Sections 4.2–4.3 and 8. Trace Perfex invoice editor totals separately from estimate/proposal helpers.

Choose the decimal strategy and rounding policy. Build invoice/line/tax models, calculation service, draft requests/actions, server preview endpoint if needed, invoice table and draft create/edit pages. Catalogue selections copy editable values into a draft. Support invoice currency, dates, descriptions, units, quantities, rates, the agreed discount model and taxes. Persist totals only from the server calculator.

Acceptance: drafts save and reopen with identical totals; tampered submitted totals cannot change accounting values. Customer or service edits do not unexpectedly overwrite saved draft lines. Conflicting edits are detected through a version/timestamp mechanism. Drafts have no permanent number.

Tests: all arithmetic fixtures, input bounds, mixed taxes, rounding, line order, currency mismatch, optimistic edit conflict and unauthorized access. Include frontend tests only where they verify meaningful calculations or interactions rather than mirroring code.

### Stage 4 Issuance numbering and cancellation

Read Perfex numbering/status functions and Section 8. Build the sequence allocator, immutable snapshots, explicit issue action, read-only issued view, activity records and restricted cancellation.

Acceptance: issuance requires valid customer/issuer data and lines. Repeated issuance is idempotent; concurrent issuance cannot duplicate numbers. Company/customer/catalogue updates do not change issued values. Drafts remain editable; issued amounts are locked. Cancellation retains the number and requires a reason.

Tests: transitions, snapshot preservation, duplicate issue request, uniqueness, rollback, forbidden edits and cancellation policy. Run a database-appropriate concurrency check on the intended deployment engine; document when that engine is unavailable.

### Stage 5 Manual payments and balances

Read Section 4.4. Build payment methods/entry, payment history, reversal with audit, derived settlement state, remaining balance and customer totals grouped by currency.

Acceptance: partial payments reduce balances; full payment settles; overpayments and payments against drafts/cancelled invoices fail. Duplicate submissions do not record the same payment twice. Reversal restores the correct balance. Customer archives do not hide historical receivables.

Tests: partial/full payment fixtures, invalid amounts/currencies/dates, simultaneous payment conflict, request idempotency, reversal, permissions and currency-separated customer totals.

### Stage 6 Invoice PDF generation

Read Section 4.5 and choose a current Laravel-compatible renderer. Build original templates, private storage/download, draft preview marking and a PDF adapter. Use issued snapshots and server totals.

Acceptance: the PDF includes issuer/customer identity, invoice number/dates, complete line descriptions, units, quantities, prices, discounts, tax breakdown, total, terms and payment instructions. Draft previews visibly say Draft. Long descriptions and many lines paginate without clipped totals or overlapping footers. Missing optional logo/contact fields remain usable.

Tests: download authorization, correct data source and error handling. Render and visually inspect representative one-page and multi-page PDFs, non-ASCII names, long addresses and rounding fixtures. A successful renderer call alone is insufficient visual verification.

### Stage 7 Invoice email and delivery history

Read invoice send references and Karti mail configuration/event patterns. Build recipient selection, queued send, PDF attachment, delivery records, explicit resend and failure display. Confirm workers apply stored email settings.

Acceptance: only issued invoices can be sent; the selected recipients and issued PDF are preserved; success/failure history is visible. Retry does not allocate another number, alter invoice totals or accidentally send duplicates for the same attempt. An intentional resend creates a new recorded attempt.

Tests: mail/job fakes, recipient selection, attachment identity, permission checks, queue retry handling, settings application and send failures. External test email is sent only when authorized; automated tests use fakes.

Stages 1–7 complete the core manual billing release. Evaluate it with a full customer-to-payment walkthrough before automation.

### Stage 8 Private invoice viewing links

Read Section 4.6. Build link creation/revocation, a minimal customer-facing page and protected PDF access. Add a link to emails only once this stage works.

Acceptance: one link accesses one issued invoice; invalid/revoked links and drafts fail; internal notes, other records and administrator actions remain private. Authorized customers can view/download without registration.

Tests: link authorization/revocation, enumeration attempts, public prop minimization and cache/indexing behavior.

### Stage 9 Due and overdue reminders

Read Perfex cron/reminder functions and Karti scheduler registration. Add reminder settings, per-invoice opt-out, scheduled command, attempt records and queued delivery.

Acceptance: draft/cancelled/settled invoices are excluded. Overdue timing respects the business date. Paid or cancelled state is rechecked immediately before sending. Repeated command runs and retries do not duplicate the same eligible reminder. Failed attempts have a bounded retry policy and useful history.

Tests: frozen time across due-date/timezone boundaries, opt-out, eligibility, scheduler repeat, payment after queueing and failed-send retry.

### Stage 10 Online payments and consultation integration

Read existing Karti booking/checkout code and Section 9. First correct payment confirmation, then establish whether the chosen provider supports the requested invoice checkout. Implement a provider adapter, authenticated webhook handling, event/payment deduplication and reconciliation.

Acceptance: verified matching successful payments create exactly one payment record. Pending/failed/spoofed events do not mark an invoice paid or a booking confirmed. Browser returns show a pending state until verified. Booking/customer association uses an explicit rule rather than blindly merging everyone with the same email.

Tests: verified success, bad signatures, amount/currency mismatch, duplicate/out-of-order events, interrupted processing and replay. Confirm whether the provider or this business is the issuer of any provider-generated documents before generating potentially duplicate invoices.

### Stage 11 Recurring invoices

Read `Cron_model::recurring_invoices`. Build a separate recurrence definition with interval, next run, timezone, finite/infinite cycles, active state and generation policy. Decide whether recurrence creates drafts or issues/sends automatically.

Acceptance: one schedule occurrence creates one invoice even with overlapping workers; failed runs recover; missed runs follow an explicit catch-up policy; month-end dates and cancellation behave predictably. Generated records preserve links to their source schedule.

Tests: occurrence uniqueness, month-end/leap dates, paused schedules, finite cycles, retries and catch-up. Do not enable automatic issuance/send without an explicit configured policy.

### Stage 12 Statements credit notes and optional imports

These are separate tasks, not one combined change. Statements require opening/closing balances by currency. Credit notes require their own numbering, snapshots, allocations and refund rules. Imports require an inventory, explicit mapping and a dry-run report before writes.

Acceptance: statement totals reconcile; credits cannot exceed eligible amounts or be applied across currencies; import reruns do not duplicate records and preserve historical invoice numbers and payment associations.

Do not import portal passwords, unrelated CRM tables or billing data into public publishing modules. Existing Perfex data migration is optional because the presence of application source does not establish that there is business data to transfer.

## 11 Proposed routes and screens

These routes are a design starting point, not registered endpoints:

| Route/action                                       | Screen or responsibility                     |
| -------------------------------------------------- | -------------------------------------------- |
| `/admin/customers` and customer create/edit/detail | Customer management and history.             |
| `/admin/services`                                  | Reusable service catalogue.                  |
| `/admin/settings/billing`                          | Single issuer identity and invoice defaults. |
| `/admin/invoices` and invoice create/edit/detail   | Draft editor and issued invoice view.        |
| `POST /admin/invoices/{invoice}/issue`             | Transactional issuance.                      |
| `POST /admin/invoices/{invoice}/cancel`            | Reasoned cancellation.                       |
| `GET /admin/invoices/{invoice}/pdf`                | Authorized PDF download.                     |
| `POST /admin/invoices/{invoice}/send`              | Explicit send attempt.                       |
| `POST /admin/invoices/{invoice}/payments`          | Record a manual payment.                     |
| `POST /admin/payments/{payment}/reverse`           | Auditable reversal.                          |
| `/admin/payments`                                  | Payment history.                             |
| `/invoice/{token}`                                 | Later private invoice view.                  |

Use numeric/internal identifiers or another deliberate binding strategy for admin records; a public portfolio slug is not an authorization mechanism. Protect mutation endpoints with policy checks and CSRF protection where appropriate. Do not introduce navigation to unfinished routes.

Customer detail should expose overview, contacts, invoices and payments as they become available. Invoice detail should clearly distinguish customer-visible notes from internal notes, and issuance from email sending. Dashboard cards should name the period and currency and distinguish issued invoice totals from cash actually collected.

## 12 Verification and completion requirements

Use existing module test discovery. Run targeted billing tests when implemented, for example `php artisan test modules/billing/tests`. Relevant repository checks include `npm run types`, `npm run build` and `composer test:lint`; choose checks according to the files changed and report actual outcomes. For formatting checks scoped to new PHP files, use the existing Pint tooling with the billing path.

Do not run migrations against an unknown production database. Verify schema changes in the configured local/test environment and report deployment migration needs separately. Concurrency behavior and PDF appearance need their own verification beyond unit tests.

Each implementation report should state:

- The completed stage and user-visible behavior.
- The actual files and decisions added or changed.
- Tests/checks run and any material unverified behavior.
- Required configuration or migration steps.
- The next incomplete stage.

Do not mark a stage complete merely because models or migrations exist. Its acceptance criteria must work through the intended UI or API, with authorization and failure handling.

## 13 Reusable instructions for future AI sessions

### Start the first stage

```text
Read docs/customer-billing-implementation-reference.md in /Users/kk/projects/karti.dev.
Implement Stage 1, module foundation and customer management, using the referenced
Perfex source at /Users/kk/projects/perfex_crm for behavior and Karti's existing
modules for implementation conventions. Complete the customer/contact UI,
authorization, archive behavior and relevant tests. Do not implement later billing
stages. Preserve unrelated changes. Update the progress ledger with actual files,
decisions and verification, and report the next stage.
```

### Continue an agreed stage

```text
Read docs/customer-billing-implementation-reference.md and its progress ledger.
Implement Stage [number and name]. Recheck existing code and stage dependencies;
use Perfex only as reference. Complete the stage's acceptance criteria and relevant
checks, record decisions and remaining limits, and update the ledger. Do not expand
into later stages unless necessary to complete the requested stage.
```

### Review a completed stage

```text
Review the implementation of Stage [number] against the reference document,
acceptance criteria and current diff. Check financial correctness, permissions,
data privacy, transaction behavior and appropriate tests. Report concrete defects
with file references and fix the authorized stage's defects without adding later
features. Update verification in the ledger.
```

### Import existing Perfex business data

```text
Read the implementation reference and inspect the authorized Perfex export/schema.
Prepare a dry-run mapping for customers, contacts, invoices, items, taxes and
payments. Identify missing fields, currency/rounding differences and duplicate
identities. Preserve original invoice numbers and associations. Do not write to
the destination database until the mapping and import destination are agreed.
```

## 14 Decisions and progress ledger

### Established scope

One issuing business, native Karti module, customer and invoice focus, no leads or full CRM migration. Perfex behavior is a reference, not a requirement to reproduce every option. Customers may be businesses or individuals.

### Proposed defaults to confirm at the relevant stage

| Decision                  | Proposed starting point                                                                       | Needed before                      |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------- |
| Module name               | Billing                                                                                       | Stage 1.                           |
| Issuer identity           | User supplies actual legal/company details                                                    | Real issuance.                     |
| Currency                  | Default remains unset until explicitly selected; supported choices are listed in `Currencies` | Select before real issuance.       |
| Business timezone         | Asia/Kolkata initialized in Stage 2; configurable                                             | Due-date/reminder rules.           |
| Invoice numbering         | `INV-000001`, continuous sequence, no automatic reset                                         | Stage 4.                           |
| Discount policy           | Invoice-wide fixed/percentage before tax                                                      | Stage 3.                           |
| Price model               | Tax-exclusive; additive configured item taxes                                                 | Stage 3.                           |
| Decimal implementation    | Brick Math exact decimals and integers; monetary values stored in minor units                 | Implemented in Stage 3.            |
| Payment methods           | Manual configured methods first                                                               | Stage 5.                           |
| PDF renderer              | Select behind an adapter after checking deployment requirements                               | Stage 6.                           |
| Online payment provider   | Evaluate supported behavior; do not assume existing Dodo flow is sufficient                   | Stage 10.                          |
| Tax-specific fields/rules | Confirm actual requirements; generic labels are the initial scope                             | Any jurisdiction-specific feature. |
| Existing data transfer    | Optional; source code alone does not establish data to import                                 | Import task.                       |

Tax presets are arithmetic configuration, not a compliance claim. If jurisdiction-specific invoicing or electronic submission is requested, verify current authoritative requirements during that task and record their implications before implementation.

### Stage status

| Stage                            | Status   | Evidence and remaining work                                                                                                                                               |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reference preparation            | Complete | Source maps, native design, stage plan and acceptance criteria recorded here.                                                                                             |
| 1 Customer management            | Complete | Native billing module, customer/contact screens, permissions, search, archive/restore and tests implemented. See the dated entry below.                                   |
| 2 Settings and catalogue         | Complete | Private billing settings, service catalogue, tax presets, currency-specific lookup, logo reference and permissions implemented.                                           |
| 3 Drafts and calculations        | Complete | Exact calculator, persisted draft lines/taxes, snapshots, live previews, version conflicts and shadcn editor verified.                                                    |
| 4 Issuance                       | Complete | Reviewed issuance, continuous numbering, frozen document data/logo bytes, cancellation and activity verified.                                                             |
| 5 Manual payments                | Complete | Manual methods, exact balances, auditable reversals, idempotent requests, payment/customer history and live admin checks verified.                                        |
| 6 PDFs                           | Complete | Private PDFs, screenshot-matched print layout, settlement and visual pagination checks.                                                                                   |
| 7 Email                          | Complete | Email queue, immutable attachments, delivery/link history and conservative uncertain-send handling implemented.                                                           |
| 8 Private links                  | Complete | Expiring/revocable invoice-only tokens, minimized customer view and protected PDF verified.                                                                               |
| 9 Reminders                      | Complete | Timezone-aware offsets, opt-out, unique occurrences and pre-send eligibility/snapshot checks verified.                                                                    |
| 10 Online payments               | Complete | Provider adapter, signed webhook/API reconciliation, protected returns and explicit booking/customer association implemented; external activation requires configuration. |
| 11 Recurring invoices            | Complete | Copied schedules, draft/issue/send policies, finite cycles, month-end catch-up and occurrence uniqueness verified.                                                        |
| 12 Accounting extensions/imports | Complete | Credit/refund ledger, currency-separated statements and reviewed/idempotent import tooling implemented.                                                                   |

For each completed stage, append a dated entry with implementation paths, significant decisions, test results and any remaining acceptance gaps. Keep the design sections aligned with the actual implementation so later AI sessions do not follow obsolete proposals.

### Stage 1 completed on 10 October 2026

Implemented `modules/billing` and registered the package in root `composer.json` and `composer.lock`. The package owns its routes, migrations, models, factories, requests, policies, contact transaction action, customer table, pages and feature tests.

Actual implementation paths:

- `modules/billing/src/Providers/BillingServiceProvider.php` registers migrations, routes, the customer policy and the access command.
- `modules/billing/database/migrations/2026_10_10_100000_create_billing_customers_and_contacts.php` creates `billing_customers` and `billing_contacts`.
- `modules/billing/database/migrations/2026_10_10_100100_register_customer_permissions.php` registers six customer permissions and grants them to the `admin` role. The existing shared `super-admin` policy bypass remains effective.
- `modules/billing/src/Models/Customer.php` and `Contact.php` hold business records separately from administrator users. Their factories live in `modules/billing/database/factories`.
- `modules/billing/src/Http/Requests/SaveCustomerRequest.php` and `SaveContactRequest.php` validate input and normalize email/country/currency formatting.
- `modules/billing/src/Http/Controllers/CustomersController.php` and `ContactsController.php` enforce policy access. Nested contact routes use scoped bindings so a contact from another customer cannot be edited, archived or restored.
- `modules/billing/src/Actions/ManageContact.php` locks the parent customer during contact mutations. `primary_slot` is 1 for the primary contact and null otherwise; a unique customer/slot constraint prevents two primary contacts. The model exposes `is_primary` to the frontend. Selecting a new primary replaces the old primary; archiving it promotes the first remaining active contact. Repeated restore and edits preserve an existing primary.
- `modules/billing/src/Tables/Customers.php` defaults to active records, supports customer type/status filters and searches customer names, phone numbers and primary billing email. Table resource, action and export resolution is authorized. There are no exports or destructive/bulk mutation actions in Stage 1.
- `modules/billing/resources/js/pages/customers/index.tsx`, `form.tsx` and `show.tsx` provide list, create/edit and detail screens. `modules/billing/resources/js/components/contact-form.tsx` provides inline contact editing with unsaved-change protection.
- `modules/shared/resources/js/config/navigation.ts` and `components/app-sidebar.tsx` expose Business → Customers only to users with list access. `modules/shared/src/Http/Middleware/HandleInertiaRequests.php` shares the capability flag, without sharing customer data on public pages.

Archive decisions: customer and contact records remain in their tables. An archived customer can be viewed and restored, but customer/contact edits are blocked until restoration. Individual contacts archived before a customer archive remain archived after customer restoration. No customer/contact delete endpoints exist. No invoice, payment or balance placeholder has been added.

Access setup:

```sh
# Deploy/install the new package from the updated lock file.
composer install

# Run normal deployment migrations in the intended environment.
php artisan migrate

# For a fresh local installation without administrator accounts, use the
# existing interactive account command and choose an actual name/password.
php artisan user:create --admin

# To grant customer management to an existing account without changing its role:
php artisan billing:customer-access existing-user@example.org

# To remove only that account's direct customer permissions:
php artisan billing:customer-access existing-user@example.org --revoke
```

The email in these examples is a placeholder; replace it with the intended existing account. Revoking direct access does not revoke permissions inherited from `admin` or `super-admin`. Stage 1 migrations were applied to the configured local SQLite database; that database had no users, and no persistent administrator was created by this implementation task. The browser verification account and customer data were confined to a separate temporary SQLite database.

Verification:

- 22 billing feature tests cover CRUD, normalization, validation, permissions, read-only access, super-admin access, direct table endpoint protection, customer/contact archive and restore, primary-contact invariants, cross-customer contact IDs, duplicate email across customers and public data isolation.
- Full PHP suite: 714 tests and 3,367 assertions passed with `php -d memory_limit=512M vendor/bin/pest --compact`. The default 128 MiB full-suite run exhausted memory in the existing disposable-email dependency; increasing runner memory completed the suite.
- Six existing navigation and unsaved-change frontend tests passed.
- Client and SSR production builds passed through `npm run build:ssr`.
- ESLint passed for billing frontend files and the changed sidebar/navigation files. Pint passed for the billing module and changed middleware; diff whitespace checks passed.
- The repository type check still has 57 diagnostics. A compiler comparison against original tracked frontend files, with the new billing files excluded from the baseline, found exactly the same 57 diagnostics and no additions from Stage 1. Existing type errors were not changed in this task.
- A browser walkthrough created and edited a customer/contact, archived/restored both records, verified the list and checked the customer detail at desktop and 390 px mobile widths. No browser page errors or horizontal mobile overflow occurred. Screenshots were inspected for layout.

Remaining limits: concurrency was verified through transaction behavior and the SQLite uniqueness constraint, not parallel workers on MySQL/PostgreSQL. Country/currency inputs currently validate uppercase code shape; supported currency choices and precise financial arithmetic belong to Stages 2–3. Invoice-related customer selection does not exist yet; future queries must exclude archived customers by default.

Stage 2 extended this same module as recorded below. Reuse the completed customer subsystem and its permissions in subsequent stages.

### Stage 2 completed on 10 October 2026

Company billing settings, reusable services and named tax presets are available inside the existing billing module. No invoice, invoice sequence, payment or automatic tax classification has been introduced.

#### Actual settings implementation

`modules/billing/src/Settings/BillingSettings.php` owns the `billing` settings group. It is registered explicitly in `config/settings.php` and initialized by `modules/billing/database/migrations/2026_10_10_110100_initialize_billing_settings.php`.

Fields are `display_name`, `legal_name`, `address`, `address_line_2`, `city`, `state`, `postal_code`, `country`, `tax_identifier`, `email`, `phone`, `logo_media_id`, `timezone`, `default_currency`, `due_days`, `number_prefix`, `number_padding`, `default_terms` and `payment_instructions`.

Company identity and currency start empty. Timezone starts as Asia/Kolkata; due interval is 30 days; number prefix is `INV-`; padding is six digits. Zero due days means due on the invoice date. These are editable defaults, not a claim that the business has any particular identity, tax registration or invoice compliance configuration. Sequence allocation still belongs to Stage 4.

`modules/billing/src/Http/Controllers/BillingSettingsController.php` provides `GET /admin/settings/billing` and `PUT /admin/settings/billing`, named `admin.settings.billing.edit` and `.update`. `UpdateBillingSettingsRequest.php` validates partial identity configuration, supported currency, timezone, number formatting, due interval and media reference. `BillingSettingsPolicy.php` requires separate view/update abilities and preserves the existing super-admin bypass.

`modules/billing/resources/js/pages/settings.tsx` provides the editable settings page, unsaved-change protection and original invoice-number formatting preview. Billing settings are not added to public site props or used to change website identity. Service forms receive only the default currency from these settings.

#### Logo references

The logo is a nullable media ID, not a copied URL. The existing media picker supports selection/upload. Accepted originals are JPEG, PNG and WebP; SVG and generated variants are rejected. `modules/media/src/Support/MediaUsage.php` reports a billing logo reference so normal media deletion is blocked while it is selected. Moving the media keeps the same ID, so the reference remains valid without URL rewriting. Removing the logo selection releases that reference.

Stage 6 must resolve this media ID through the media/storage service when preparing PDFs, and freeze the issued logo/document representation as part of the issuance design. Do not assume a private disk has a public URL or copy an arbitrary submitted remote image URL into a renderer.

#### Actual catalogue implementation

`modules/billing/database/migrations/2026_10_10_110000_create_billing_catalogue.php` creates:

- `billing_services`: name, description, unit, `rate` as decimal(19,4), currency, archived timestamp and normal timestamps.
- `billing_tax_rates`: name, `percentage` as decimal(7,4), archived timestamp and normal timestamps.
- `billing_service_tax_rates`: unique service/tax associations with restricted foreign-key deletion.

`Service.php` and `TaxRate.php` in `modules/billing/src/Models` cast decimal values to four-place strings. Their factories live in `modules/billing/database/factories`. `SaveServiceRequest.php` requires an explicit supported currency and a decimal string price from zero to 999999999.9999, with up to four decimal places. Scientific notation, negative prices, numeric JSON floats and extra precision are rejected. `SaveTaxRateRequest.php` accepts decimal string percentages from zero through 100 with up to four decimal places. No tax preset is seeded automatically.

`modules/billing/src/Support/Currencies.php` is the initial supported currency catalogue: INR, USD, EUR, GBP, AUD, CAD, SGD, JPY, AED and CHF. It includes precision metadata, including zero decimals for JPY. This metadata is a starting input to Stage 3, not an implemented totals calculator or exchange-rate service. Catalogue unit prices retain four-place precision even when an invoice currency has fewer display decimals.

`modules/billing/src/Actions/SaveService.php` saves service details and tax associations in a transaction. It rechecks the selected taxes under row locks. New selections must use active tax presets. Existing archived selections may be retained while editing other fields or removed; they cannot be newly assigned. `SetCatalogueArchived.php` preserves record IDs and associations during archive/restore.

`ServicesController.php` and `TaxRatesController.php` provide index/create/detail/edit, save, archive and restore routes under `/admin/services` and `/admin/tax-rates`. No delete routes exist. Archived records remain viewable, but must be restored before editing.

`CatalogueTable.php`, `Services.php` and `TaxRates.php` in `modules/billing/src/Tables` authorize resource, action and export resolution. Lists default to active records, support search/status filters, and services also support a currency filter. There are no exports or bulk mutation actions in this stage. React pages live under `resources/js/pages/services` and `resources/js/pages/tax-rates`; shared catalogue components live under `resources/js/components`.

#### Catalogue lookup for the invoice editor

`GET /admin/services/lookup` is named `admin.services.lookup`. It requires service list permission and a supported `currency` query value; `search` is optional. Responses contain at most 25 services sorted by name. Only active services in that exact currency are returned. Search treats `%` and `_` as literal characters, not user-supplied wildcard instructions.

Each lookup result includes `id`, `name`, `description`, `unit`, the decimal string `rate`, `currency` and active `tax_rates` with ID/name/decimal percentage. Archived taxes are excluded even when an existing service still references them. A currency with no matching services returns an empty list. Missing/unsupported currency is rejected; there is no automatic conversion or fallback to another currency.

Stage 3 should copy selected descriptions, prices, units and applied tax values into invoice draft lines. Never make an issued invoice depend on mutable catalogue prices or preset percentages. For a catalogue service in another currency, require an explicit price rather than inventing a conversion. It is also valid to create a draft line without a catalogue service.

#### Access and navigation

`ServicePolicy.php`, `TaxRatePolicy.php` and `BillingSettingsPolicy.php` are registered by `BillingServiceProvider`. `BillingPermissions.php` lists separate catalogue/settings permissions and combines them with Stage 1 customer permissions. The Stage 2 permission migration grants catalogue/settings abilities to the existing `admin` role; `super-admin` continues to use the shared bypass. Other users receive no automatic grants.

Business navigation now contains Customers, Services and Tax presets. Settings contains Billing settings. Each billing entry is independently filtered by its view capability; a services-only user does not need customer-list permission to see Services. Capability flags are booleans and do not contain issuer details or payment instructions.

For an existing user who should have all currently implemented billing features:

```sh
php artisan billing:access existing-user@example.org
```

Use `--revoke` to remove direct grants. Role-derived permissions remain intact. The Stage 1 `billing:customer-access` command still grants customer-only access. Replace the example email with the intended existing account; neither command creates a user.

All three Stage 2 migrations were applied to the configured local SQLite database. No real company identity, currency, services or tax rates were inserted into that database by this task. Browser test values were confined to the temporary verification database.

#### Verification and remaining limits

- 32 Stage 2 tests cover settings initialization/persistence/privacy, unchanged website identity, validation, original logo type selection, protected logo deletion and a real media move, service/tax CRUD, decimal values, supported currencies, permissions/read-only access, archive/restore, selected archived tax handling, catalogue lookup and direct table endpoint protection.
- Full PHP suite passed: 746 tests and 3,657 assertions, using the 512 MiB test-runner memory limit documented in Stage 1. Targeted Stage 2 tests passed with 290 assertions after the tax-editor regression check was added.
- Six existing navigation and unsaved-change frontend tests passed.
- Client and SSR production builds passed. Scoped ESLint, Prettier, Pint and diff whitespace checks passed.
- Compiler comparison found the same 57 pre-existing TypeScript diagnostics and no additions from the billing files or changed shared navigation.
- Browser verification saved/reloaded billing settings, selected a media logo, created/edited/archived/restored tax presets and services, checked the configured currency default and exact catalogue lookup price, and inspected desktop/mobile layouts. The selected logo thumbnail loaded successfully. No browser page errors or horizontal overflow occurred at 390 px for service and settings screens.

The invoice calculation strategy and rounding policy are still undecided and must be established in Stage 3. Catalogue decimals are precise persisted inputs; they are not invoice arithmetic. Country fields still validate code shape rather than a full jurisdiction catalogue. Stage 1 customer currency fields also still validate code shape; Stage 3 must validate a customer's default against `Currencies` before using it, and require an explicit supported currency when it does not match. Database locking was tested with SQLite transactions, not simultaneous production-engine workers. Tax presets remain configurable arithmetic values without automatic jurisdiction rules.

Stage 3 extended these settings and catalogue features as recorded below.

### Stage 3 completed on 10 October 2026

Draft invoices can be created, edited, reopened and viewed under Business → Invoices. The editor supports customer search, currency, invoice/due dates, service lookup, manual lines, quantities, units, prices, multiple tax presets or custom named taxes, fixed/percentage discounts before tax, customer/internal notes, terms and payment instructions. Drafts have internal IDs and no permanent invoice number. Issuance, cancellation, payments, PDF generation, email and deletion endpoints remain outside Stage 3.

#### Exact calculation rules

`modules/billing/src/Services/InvoiceCalculator.php` uses Brick Math 0.14 BigDecimal and BigInteger. The billing package explicitly requires `brick/math` in its Composer manifest; the installed dependency already existed in the application. Decimal input values are strings. Monetary amounts are stored as integer minor units, not floating-point decimal database columns.

The algorithm is:

1. Multiply quantity and price exactly, then round each line gross amount HALF_UP to the selected currency precision.
2. Sum rounded line gross amounts to obtain the subtotal.
3. For percentage discounts, multiply subtotal minor units by the percentage and round the discount HALF_UP to a whole minor unit. Fixed discounts must already fit the currency precision; extra precision is rejected. Discounts cannot exceed the subtotal.
4. Allocate the discount proportionally by gross line amount using integer division. Distribute any remaining minor units to the largest remainders. Equal remainders are ordered by the stable UUID line key, so reordering lines does not change the financial result.
5. Subtract each allocated discount from its line gross amount. Calculate each applied tax independently on this net amount; taxes do not compound. Round each tax per line HALF_UP to a whole minor unit.
6. Group rounded taxes by normalized name and percentage and sum them. Total equals subtotal minus discount plus rounded tax amounts.

Quantities must be positive decimal strings with up to six integer digits and four decimal places. Prices must be nonnegative decimal strings up to 999999999.9999. Tax percentages are 0–100 with up to four decimal places. Each invoice supports at most 100 lines and 10 taxes per line. Calculated amounts are bounded to 100000000000000000 minor units; larger results are rejected before persistence. The calculator handles zero-priced lines, zero subtotals, full discounts and JPY precision zero explicitly.

The editor requests formatted totals from the server and performs no authoritative money arithmetic in JavaScript. It clears stale previews when inputs change, debounces requests and cancels superseded requests. Money strings such as `2655.00` are the display values; JavaScript must not use numeric minor-unit fields for arithmetic when values exceed its safe integer range. Save operations recalculate independently of preview responses and ignore client-supplied totals, numbers, lifecycle and snapshots.

#### Actual invoice storage

`modules/billing/database/migrations/2026_10_10_120000_create_billing_invoice_drafts.php` creates `billing_invoices`, `billing_invoice_items` and `billing_invoice_item_taxes`.

- Invoices hold customer ID, draft lifecycle, nullable unique `formatted_number`, date-only invoice/due dates, currency and precision, integer version, customer/seller snapshots, discount inputs, integer subtotal/discount/tax/total minor units and notes/terms/payment instructions.
- Items hold a stable UUID key unique within an invoice, position, optional service ID, copied descriptions/unit/quantity/rate, and integer gross/discount/net/tax/total minor units.
- Item taxes hold an optional preset ID, copied name/percentage and integer amount minor units.

Models are `Invoice.php`, `InvoiceItem.php` and `InvoiceItemTax.php` under `modules/billing/src/Models`. Child records cascade when an invoice/item is removed internally. Customer, service and tax references restrict destructive deletion. No invoice delete UI or route is exposed. Date props are formatted as `Y-m-d`, not UTC timestamp strings.

#### Validation and draft persistence

`modules/billing/src/Http/Requests/SaveInvoiceRequest.php` validates inputs, supported currency, date order, UUID keys, decimal string bounds and array shapes. `ValidateDraftReferences.php` checks customer/catalogue eligibility and optimistic version conflicts. `SaveInvoiceDraft.php` locks an existing invoice, checks the version, validates referenced records under locks, calculates totals and persists the invoice/children in one transaction.

New drafts require an active customer. Existing drafts may retain an archived customer, service or tax reference; newly selected archived references are rejected. New service associations must match the invoice currency. Saved line values remain valid when the original catalogue price/currency or tax preset changes: the copied inputs are authoritative for that draft, not a live catalogue join. A currency change in the editor requires a shadcn confirmation and clears line prices/service associations, so prices must be explicitly re-entered in the new currency.

Customer and issuer snapshots are copied when the draft is first created. Editing the original records does not silently change saved billing details. Changing the draft customer refreshes the customer snapshot; an explicit checkbox also allows refreshing the same customer's billing details on save. Seller identity remains the saved draft snapshot. Stage 4 must provide an explicit issuer review/refresh path when an earlier draft was created before company details were configured; issuance must validate those details rather than invent them.

The draft `version` starts at 1 and increments after every successful save. A stale version produces a field error and leaves persisted data unchanged. The editor offers a shadcn confirmation to reload the current draft. Read-only responses include only the invoice's selected customer and saved terms/instructions, not unrelated customer choices, active tax presets or updated private settings.

Invoice snapshots that reference a logo media ID are also reported by `modules/media/src/Support/MediaUsage.php`; changing the settings logo no longer releases a media reference still used by a draft. Stage 4/6 must freeze the actual issued representation appropriately, since a media ID alone is not an immutable copy of image bytes.

#### Routes permissions and source map

`modules/billing/src/Http/Controllers/InvoicesController.php` handles index/create/detail/edit, save, preview and customer options. `Invoices.php` under `src/Tables` authorizes table resolution and supports customer search, currency/date filters and formatted totals. It exposes no exports or bulk mutations.

Routes are `admin.invoices.index/create/show/edit/store/update`, `admin.invoices.customer-options`, `admin.invoices.preview` and `admin.invoices.draft-preview`. The preview endpoint for a new draft is `POST /admin/invoices/preview`; an existing draft uses `POST /admin/invoices/{invoice}/preview` and requires its version. Preview does not create or update any records. Customer options are limited to 30 active records and can be searched; an editor retains its selected customer when narrowing the results.

`InvoicePolicy.php` is registered in `BillingServiceProvider`. The Stage 3 permission migration registers view-any, view, create and update invoice abilities and grants them to the admin role. The all-billing access command includes these abilities. Invoice navigation is independently filtered by view capability. Catalogue selection additionally uses the existing service-list ability; an invoice editor without it can still enter manual lines.

Frontend references:

- `modules/billing/resources/js/pages/invoices/index.tsx`: invoice table entry point.
- `modules/billing/resources/js/pages/invoices/form.tsx`: create/edit/read-only form, preview requests, version handling, ordering, tax/discount controls and confirmations.
- `modules/billing/resources/js/invoice-types.ts`: DTOs, stable line keys and editable form normalization.
- `modules/billing/resources/js/components/service-picker.tsx`: currency-specific catalogue search that copies selected values into the draft.
- `modules/billing/resources/js/components/billing-select.tsx`: shared shadcn Select wrapper, including optional clear selection.
- `modules/billing/resources/js/components/use-billing-confirm.tsx`: shadcn AlertDialog confirmation hook.
- `modules/billing/resources/js/components/billing-feedback.tsx`: shadcn Alert feedback.

The user's shadcn requirement also applies retroactively to the completed customer, contact, service, tax and settings screens. Their native selects, native checkbox inputs, browser confirmation prompts and custom feedback/panel containers were replaced with shared shadcn components. Continue using these components in future stages.

#### Local administrator and live verification

At the user's request, a persistent local administrator account was created using the existing user creation command. Its generated login details were saved outside the repository and shared separately. No password was added to source, the reference guide or Git.

Live browser tests used the configured local SQLite database and that account. Clearly labelled demo customer/contact/service/tax data and draft #2 remain for review. The draft contains two units at 1000 plus one unit at 500, a 10% discount and an illustrative 18% tax, giving 2655.00 INR. It has no permanent number and was not sent or paid. Company identity remains unconfigured; no legal name or tax registration was invented. The demo service's current catalogue price was deliberately changed during testing; the saved draft still uses its copied 1000 price.

Verification:

- 35 new tests, comprising 9 calculator tests and 26 invoice feature cases, cover rounding, mixed/additive taxes, fixed discount allocation, stable residuals after reordering, zero/full discounts, fractional quantities, JPY precision, large exact values, limits, snapshots, stale edits, archive/currency eligibility, date validation, rollback, permissions and public/read-only data isolation.
- Full PHP suite passed: 781 tests and 3,882 assertions with the existing 512 MiB test-runner setting. The billing subset passed 89 tests before the additional read-only assertions were included in the full suite.
- Client and SSR builds passed. Scoped ESLint, Prettier, Pint, Composer validation and diff whitespace checks passed. Six existing navigation/unsaved-change frontend tests passed.
- The type check retains the same 57 pre-existing diagnostics, with no diagnostics in the added/changed billing frontend files. A compiler baseline comparison before the shadcn conversion also found no added diagnostics.
- Live creation saved/reopened the agreed 2655.00 draft; later catalogue edits did not change its copied values. Two browser sessions verified that a stale edit cannot overwrite a newer version.
- Live shadcn checks exercised customer type selection, contact checkboxes, cancelling/accepting discard/archive dialogs, service currency/tax controls, settings timezone/currency selection and clearing, cancelled invoice currency changes, tax selection and invoice saves. Desktop/mobile screenshots were inspected, with no browser page errors or horizontal overflow at 390 px.

Stage 4 added permanent numbering and issued document handling as recorded below. MySQL/PostgreSQL worker locking remains unverified; SQLite concurrency verification is included in the next entry.

### Stage 4 completed on 10 October 2026

Drafts can now be explicitly reviewed and issued. Issued and cancelled invoices use a separate read-only document view, with stored customer/company details, line amounts, totals and activity history. The workflow remains entirely within the administration application; PDF/email/payment features are separate stages.

#### Schema and number allocation

`modules/billing/database/migrations/2026_10_10_130000_add_invoice_issuance.php` adds `customer_name`, unique nullable `sequence_number`, saved `number_prefix`/`number_padding`, `issued_at`, `cancelled_at` and `cancellation_reason` to invoices. Existing draft customer names are backfilled from their saved snapshots.

The migration creates `billing_invoice_sequences` with one row: scope `invoices`, next number 1. `billing_invoice_activities` holds invoice ID, nullable administrator ID, saved administrator name, event, description and creation time. Existing history is not invented; activity starts when this feature is introduced.

`modules/billing/src/Actions/IssueInvoice.php` locks the invoice, checks its lifecycle/version, rebuilds the reviewed details and verifies the review token. It then locks the sequence row, advances the counter, freezes the document identity, assigns the formatted number, marks the invoice issued and records an activity in one transaction. Number uniqueness is enforced both for `sequence_number` and `formatted_number`.

SQLite WAL needs a writer reservation before reading a transaction that will later write. The action performs a no-change update of the sequence row at the start of SQLite transactions, then reads the invoice/customer under the transaction. This does not advance the counter. Other engines use normal row locks. Transactions allow five retries for recognized concurrency errors.

Numbering is continuous across prefix/padding changes and cancellation. Padding is a minimum width, never truncation. Annual/financial-year resets are not implemented. Repeating an already successful issue request returns the existing issued invoice without consuming another number or duplicating activity. Cancelled invoices cannot be issued again.

#### Review and validation

`modules/billing/src/Services/InvoiceIssueReview.php` prepares the review. `BillingSnapshots.php` provides consistent company/customer identity projections. The review shows the chosen billing details and saved monetary values. Two shadcn checkboxes explicitly choose current or saved company/customer details; current company details are the default, while saved customer details remain the default. Changing a checkbox loads a fresh review, displays its new selection immediately and blocks submission while the refresh is pending.

Minimum issuance requirements are company legal name, company address/country code, customer name and customer billing address/country code. An optional company billing email must be valid. An archived customer cannot be issued an invoice. These are generic application requirements, not jurisdiction-specific compliance rules; tax registration remains optional.

The service validates saved invoice inputs and recomputes totals to ensure stored invoice, line and individual tax amounts still agree with the calculator. Differences require saving the draft again. No unexpected total changes are applied during issuance.

The review token is an HMAC over the draft version, chosen snapshots, saved invoice inputs/totals, numbering format and selected logo byte hash. A change to reviewed inputs, selected profile data, company details or numbering configuration invalidates the review. The next sequence value is deliberately excluded: the number is assigned on issuance, and the UI labels its preview as a format example rather than reserving a number during review.

`IssueInvoiceRequest.php` accepts only the version, review token and snapshot choices. User-supplied identity/amount/number fields cannot replace the prepared review. `GET /admin/invoices/{invoice}/issue-review` and `POST /admin/invoices/{invoice}/issue` require the separate issue ability. The Stage 4 permission migration grants issue/cancel abilities to admin; the full billing access command includes them.

#### Frozen document data and logo bytes

`modules/billing/src/Services/InvoicePresentation.php` formats persisted monetary fields using the invoice's saved precision. Issued rendering never calls the totals calculator, reads catalogue prices or substitutes updated company/customer profile details. The invoice table now searches copied customer names and formatted numbers, with draft/issued/cancelled filters.

Company logos are validated as readable original PNG/JPEG/WebP images up to 5 MiB. Issuance preserves a private copy on the local disk with a unique path and a SHA-256 hash in `seller_snapshot.logo_file`. Copies unused after retries/failures are cleaned up when the committed state can be checked; an uncertain commit never triggers deletion of a referenced copy. Original image bytes can later change without rewriting the preserved issued logo. The storage descriptor is omitted from client invoice props. Stage 6 must render the private preserved copy, rather than the mutable original media file.

Issued financial and document fields have no edit endpoint. Internal-note editing after issuance is not implemented yet; any future exception must be a dedicated audited operation and must not unlock financial fields.

#### Cancellation and payment integration contract

`modules/billing/src/Actions/CancelInvoice.php` accepts issued invoices only, requires the current version and a reason, and records cancellation in a transaction. Draft cancellation is rejected. Repeating a successful cancellation preserves its original reason/time/activity. Cancellation never clears or decrements the invoice number and does not allow reopening/reissuing the record.

If `billing_payments` exists, cancellation checks records by `invoice_id`. When `reversed_at` exists, non-reversed records block cancellation; otherwise all associated records conservatively block it. Stage 5 should implement the planned `invoice_id` and `reversed_at` fields and preserve this contract. Payment recording/reversal must lock the same invoice row, check the issued lifecycle and update the version so cancellation cannot race a new payment. Do not replace the lifecycle with `paid`/`partially_paid`; settlement remains derived separately.

`CancelInvoiceRequest.php` validates version and a trimmed 3–2000 character reason. `POST /admin/invoices/{invoice}/cancel` requires the separate cancel ability. A shadcn AlertDialog presents the reason field and keeps the dialog open for errors. Cancelled records remain searchable/readable with their amounts, reason and activity.

#### Source map and UI conventions

- `modules/billing/src/Http/Controllers/InvoicesController.php`: issue review, issue/cancel actions, issued document response and activity projection.
- `modules/billing/src/Models/Invoice.php`: issuance fields, activity relationship and event recording.
- `modules/billing/src/Models/InvoiceActivity.php`: administrator name/event/time history.
- `modules/billing/src/Tables/Invoices.php`: permanent numbers, copied customer names and lifecycle filters.
- `modules/billing/resources/js/pages/invoices/issue-review.tsx`: explicit snapshot choices, review refresh, validation and issue confirmation.
- `modules/billing/resources/js/pages/invoices/show.tsx`: read-only issued/cancelled view and reason-based cancellation dialog.
- `modules/billing/resources/js/components/invoice-document.tsx`: shared party cards, date summary, shadcn line table, totals, notes and activity.
- `modules/billing/resources/js/pages/invoices/form.tsx`: draft history and Review and issue link, available after draft changes are saved.

All new controls and panels use the shared shadcn components. The issue/cancel flow introduces no native select, native checkbox or browser confirmation prompt.

#### Verification and retained local examples

- Fifteen new issuance cases cover duplicate issue requests, required identities, stale/changed reviews, unsupported lifecycle, archived customers, altered saved amounts, current/saved snapshots, frozen private logos, number-collision rollback, retained cancelled numbers, changed prefixes, active-payment cancellation blocking, permissions and stored-only rendering.
- Full PHP suite passed: 796 tests and 4,044 assertions. The targeted issuance tests were rerun after the validation-message/migration cleanup, and the full suite includes the final valid-payload mutation check against an issued invoice.
- Eight synchronized independent PHP processes issued different invoices concurrently against an isolated SQLite WAL database. They received eight unique consecutive sequence numbers. This did not consume numbers in the configured local application database. MySQL/PostgreSQL concurrent-worker behavior remains unverified because those deployment engines were not available for this task.
- Client and SSR builds, scoped ESLint/Prettier/Pint, whitespace checks and six existing navigation/unsaved-change tests passed. The type check retains 57 pre-existing diagnostics and no billing-file diagnostics.
- Live checks used the existing local admin account and shadcn controls. They verified blocking incomplete billing details, selecting refreshed customer details, cancelling/accepting issuance confirmation, replaying issuance without a new number, changed-profile snapshot preservation, a required cancellation reason and a second number after a prefix change. Desktop/mobile issued/cancelled layouts were inspected with no page errors or horizontal page overflow at 390 px; the line table scrolls within its container on narrow screens.

Local invoice ID 2 is now cancelled `INV-000001` for 2655.00 INR, with reason `Local verification duplicate`. Invoice ID 3 is issued `ALT-000002` for 100.00 INR and remains available for Stage 5 payment testing. Both contain clearly labelled demo identities. The original company settings and customer profile were restored after testing. The local sequence now starts its next allocation at 3; production/deployment databases were not changed, and no invoice email was sent.

Stage 5 implemented that contract as recorded below; Stage 6 invoice PDF generation is now next.

### Stage 5 completed on 10 October 2026

Manual payments are available on issued invoices, with partial/full settlement, reversals, an administration Payments list, invoice payment history, customer invoice/payment history and separate totals for each currency. All new controls use shared shadcn components, including Dialog, DateField/Calendar/Popover, Select, Checkbox, Input, Textarea, Button, Card, Table, Badge and Alert feedback. This stage records money already received; payment gateways and automatic receipts remain later stages.

#### Implementation map for the next AI task

| File under `modules/billing/`                                            | Responsibility and what to preserve                                                                                                                                 |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `database/migrations/2026_10_10_140000_create_billing_payments.php`      | Separate payment records, immutable original receipt details, unique request key, reversal metadata, restrictive invoice foreign key.                               |
| `database/migrations/2026_10_10_140100_register_payment_permissions.php` | Registers and grants admin the separate payment permissions.                                                                                                        |
| `database/migrations/2026_10_10_140200_initialize_payment_methods.php`   | Adds manual method settings to existing and fresh installations. The Stage 2 initializer excludes this later setting so migration rollback order remains valid.     |
| `src/Models/Payment.php`                                                 | Payment casts, invoice relation, hidden idempotency fields; no automatic updated timestamp.                                                                         |
| `src/Models/Invoice.php`                                                 | `payments()` relation alongside saved document items and activity.                                                                                                  |
| `src/Actions/ManagePayments.php`                                         | Sole transactional entry/reversal operations; invoice locking, exact amount conversion, balance checks, request fingerprint and activity records.                   |
| `src/Services/InvoiceBalance.php`                                        | Derives invoice settlement and customer totals from stored amounts and active payments using BigInteger; explicit presentation of payment dates and amount strings. |
| `src/Support/PaymentMethods.php`                                         | Stable method keys and display labels; enabled options come from BillingSettings.                                                                                   |
| `src/Settings/BillingSettings.php`                                       | New `payment_methods` array. Current supported methods are bank transfer, UPI, cash, cheque and other. Defaults enable all except cheque.                           |
| `src/Http/Requests/RecordPaymentRequest.php`                             | Authorized entry, decimal string/UUID/date/method shape validation, trimmed optional fields, canonical lowercase request key.                                       |
| `src/Http/Requests/ReversePaymentRequest.php`                            | Authorized reversal, invoice version and mandatory trimmed reason.                                                                                                  |
| `src/Http/Controllers/PaymentsController.php`                            | Payments index, entry and reversal routes; returns to the invoice after each operation.                                                                             |
| `src/Http/Controllers/InvoicesController.php`                            | Adds settlement, payment history, enabled methods, business date and operation capabilities to the issued view.                                                     |
| `src/Http/Controllers/CustomersController.php`                           | Adds financial summary only when both invoice list and invoice detail access are allowed.                                                                           |
| `src/Policies/PaymentPolicy.php`, `src/Support/BillingPermissions.php`   | Separate view/list, record and reverse access; billing access command includes these permissions.                                                                   |
| `src/Tables/Payments.php`, `src/Tables/Invoices.php`                     | Filterable payment listing and invoice balance/settlement columns. Invoice list eager-loads payments to avoid a query for each row.                                 |
| `resources/js/components/invoice-payments.tsx`                           | Settlement card, recording/reversal dialogs, required reversal reason, error/reload feedback and reusable PaymentHistory table.                                     |
| `resources/js/components/customer-financials.tsx`                        | Currency-separated receivables and customer invoice/payment history.                                                                                                |
| `resources/js/pages/payments/index.tsx`                                  | Shared administration table wrapper.                                                                                                                                |
| `resources/js/pages/invoices/show.tsx`                                   | Composes payment controls with the frozen invoice document and activity. Cancellation form reads the latest version when opened.                                    |
| `resources/js/pages/customers/show.tsx`                                  | Includes financial history for permitted users, including archived customers.                                                                                       |
| `resources/js/pages/settings.tsx`                                        | Shadcn checkboxes enable/disable manual methods. Disabled methods remain visible on historical receipts.                                                            |
| `resources/js/payment-types.ts`                                          | Presentation types; authoritative amounts are decimal strings.                                                                                                      |
| `tests/Feature/PaymentsTest.php`                                         | Payment, balance, replay, reversal, permissions, precision and currency-separated customer fixtures.                                                                |

Shared integration is in `modules/shared/resources/js/config/navigation.ts`, `modules/shared/resources/js/components/app-sidebar.tsx` and `modules/shared/src/Http/Middleware/HandleInertiaRequests.php`. Business navigation now includes Payments. Its capability requires payment list and detail permission; these flags do not expose financial details.

#### Routes and permission contract

- `GET /admin/payments`: `admin.payments.index`; requires `view any payment` and `view payment`.
- `POST /admin/invoices/{invoice}/payments`: `admin.invoices.payments.store`; requires `view invoice` and `record payment`.
- `POST /admin/payments/{payment}/reverse`: `admin.payments.reverse`; requires `view invoice`, `view payment` and `reverse payment`.
- `GET /admin/invoices/{invoice}` still requires invoice detail access. Invoice viewers can see settlement totals; payment details and payment-specific activity require payment detail permission.
- Customer financials require invoice list and detail access. Payment history additionally requires payment detail access. A customer-only reader receives `financials: null`.
- Existing billing settings view/update permissions control method configuration. An empty enabled-method array is supported; the recording UI explains that a method must be enabled.

No payment edit/delete endpoint exists. Correct a mistake by reversing the original record and, when appropriate, recording a replacement. Original method labels, amounts, currency, payment date, reference, notes, actor and creation timestamp are retained. Reversal adds timestamp, actor identity/name and reason; it does not overwrite receipt details.

#### Money, settlement and dates

Input amounts must be decimal strings, positive, within the supported monetary range, and exactly representable in the invoice's saved currency precision. Scientific notation, negative/zero values, numeric JSON inputs, and excess fractional digits are rejected. Amount conversion uses BigDecimal and exact integer conversion; sums use BigInteger. No authoritative calculation uses JavaScript floating-point arithmetic, SQL floating-point sums or current service prices. The amount/currency/precision stored on each payment come from the issued invoice; currency mismatches fail.

Remaining balance equals the stored invoice total minus non-reversed payment amounts. The invoice lifecycle remains `issued`; settlement is separately derived as `unpaid`, `partial` or `paid`. A zero-total issued invoice is already paid and cannot receive a positive payment. Draft/cancelled states remain separate and are excluded from receivable totals. Overdue is a separate flag: an issued invoice has a positive remaining balance and its due date precedes today in the configured business timezone.

Payment dates are date-only `Y-m-d` values. They must be real calendar dates, on or after the invoice date, and no later than today in the business timezone. This stage does not model customer advance deposits or future scheduled receipts. If those are added later, create an explicit allocation workflow instead of weakening these rules silently.

Customer totals include issued invoice totals, active payments, remaining receivables and overdue receivables. They are grouped by currency and saved precision; currencies are never added together or converted. Archived customers retain their invoices, payments and receivables, and previously issued invoices can still receive payment. The current customer history eagerly loads all associated invoice/payment rows; add pagination and database-appropriate exact aggregate queries if history volume grows significantly.

#### Transactions, retries and cancellation

Entry and reversal lock the same invoice row used by cancellation, then read the current version and payments inside the transaction. On SQLite, an initial no-op invoice update reserves the writer before any transactional read because `lockForUpdate` alone does not provide row locks. MySQL/PostgreSQL use invoice row locking. Successful new entry/reversal increments the invoice version exactly once. Stale requests receive validation feedback directing the user to reload. Overpayments fail against the balance read under this lock. Each operation commits its receipt/reversal, version change and invoice activity together.

Each opened entry form receives a UUID request key. A unique database constraint protects the key. The server fingerprints invoice ID, normalized exact minor amount, currency, payment date, method, reference and notes. Replaying the same key/details returns the original payment, even with the old version or after reversal; it does not restore a reversed payment, create another row or duplicate activity. Changing details under an already-used key fails. The fingerprint excludes version and method display label so an exact successful retry survives later invoice changes or method disabling. A new receipt requires a new key.

Reversal retries return the original reversal without changing its reason, actor, timestamp or invoice version again. Cancellation now directly checks the real payment relation; any non-reversed payment blocks cancellation regardless of amount. After all payments are reversed, cancellation becomes available again. Payment operations never change the frozen invoice number, identities, line amounts, taxes, terms or totals.

#### Verification evidence and retained local demo

- Full PHP test suite: 823 tests passed, including payment tests and method configuration. Run with `php -d memory_limit=512M vendor/bin/pest --compact`; the repository's disposable-email validation dependency exceeds the default 128 MiB test limit.
- Payment cases cover partial/full settlement, reversal/retry audit, overpayment, wrong currency, invalid dates, zero/negative/exponent/numeric inputs, precision/range errors, stale requests, disabled methods, draft/cancelled rejection, archived receivables, separate currency totals, separate permissions, Payments list/search, cross-invoice key reuse, zero-total/JPY fixtures, and exact amounts above JavaScript's safe integer limit.
- Independent SQLite WAL workers raced 60 INR and 70 INR receipts against a 100 INR invoice. One committed; the other failed its stale-version check. A second concurrent test replayed the same UUID/details in two workers; both returned the same payment ID. These fixtures use `/tmp/karti-stage4-concurrency.sqlite`, separate from the local application database. Production MySQL/PostgreSQL concurrency still requires verification on the intended deployment engine.
- The live admin account tested invoice ID 3 (`ALT-000002`, 100.00 INR): 40.00 received → 60.00 remaining; another 60.00 → fully paid; reversing the 60.00 → 60.00 remaining. A 10.00 retry fixture produced one record for repeated submissions and was subsequently reversed. The final retained demo has one active 40.00 INR payment and two reversed receipts; invoice and customer both show 60.00 INR remaining.
- Live rejection checks covered 101 INR overpayment, USD payment on an INR invoice, stale version and cancellation with an active payment. Payment history/list and configurable methods were inspected with the admin account. At 390px width, invoice/customer views and the shadcn payment/calendar dialog were checked; there was no document overflow or browser page error.
- Client and SSR production builds pass; scoped ESLint, Prettier and Pint pass. The existing repository TypeScript check still reports 57 pre-existing errors outside billing; billing introduces no new compiler diagnostics. Shared navigation/unsaved-change checks pass.
- Live results and screenshots are under `/tmp/karti-stage5-*`; credentials stay outside the repository in the restricted local admin credential file. Only clearly identified local demo financial records were changed. No external payment was processed or invoice email sent.

#### Stage 6 handoff

Start with Section 4.5, the Stage 6 acceptance criteria, `InvoicePresentation::data`, `InvoiceBalance::data`, `InvoiceDocument` and the Stage 4 private frozen-logo descriptor. Build PDFs from saved document values; never recalculate an issued invoice using current settings/catalogue/customer data. A balance/payments section, if included, is current settlement information and should be visibly distinguished from the immutable invoice total. Keep downloads authorized/private, explicitly mark draft previews, and visually inspect long/multiple-page documents and non-ASCII identities. Receipt PDF generation is a separate optional enhancement after invoice PDFs work.

### Stage 6 implemented on 10 October 2026

Invoice PDF preview and download use a native Blade template through `Contracts/InvoicePdfRenderer.php`, `Services/DompdfInvoiceRenderer.php` and `Services/InvoicePdf.php`. The module requires `barryvdh/laravel-dompdf` 3.1.x (resolved 3.1.2), Dompdf 3.1.6 and GD. Official references: [Laravel wrapper](https://github.com/barryvdh/laravel-dompdf), [Dompdf capabilities and table pagination limitation](https://github.com/dompdf/dompdf). No PDF-library files were copied from Perfex.

The user's supplied Perfex invoice screenshot is the final visual reference: logo left; heading, number and status right; issuer left and Bill To/dates right; wide description column; dark slate `#323a45` item headers with white regular-weight text; grey `#e5e7eb` total/due rows; no green PDF accents. Item names are bold and ordinary details stay directly below the name in the same row. Exceptionally long content uses bounded continuation rows. Tax columns appear only on taxed invoices. A4 margins, repeating item headers, invoice identifier and page counts are included. Do not replace this with the administration application's green theme.

`Services/InvoicePdfLayout.php` provides exact-string money display, currency symbols, English amount-in-words, font-measured wrapping, party projections, rate precision and bounded rows. Item Amount is the saved gross amount before the invoice discount/taxes; the subtotal, discount, tax groups and final total are saved server values. Rate display retains meaningful precision. Internal invoice/payment notes, payment actor names and references are excluded. Public document identity does not reproduce the customer's full contact list.

The PDF includes current Paid/Partially Paid/Unpaid state, Total Paid and Amount Due alongside the frozen issued total. Transaction details include only active payment ID, mode, date and amount, and require payment-view permission on administration downloads. Reversals are excluded from receipts. Cache fingerprints include the template content, saved document, current settlement and permitted transaction projection. Payment changes therefore produce a new PDF version; an email attempt must preserve its exact attachment rather than regenerating it later.

`GET /admin/invoices/{invoice}/pdf`, named `admin.invoices.pdf`, requires both invoice view and the separate `download invoice` permission. The Stage 6 migration grants that permission to admin and the billing access command includes it. `?download=1` returns an attachment; the default displays inline. Both return private/no-store caching and nosniff headers. Issued/cancelled PDFs and checksum sidecars are stored on the private local disk under `billing/invoices/{id}/pdf/{content-hash}.pdf`, protected by a cache lock. Invalid cached checksums regenerate the file. Draft previews are visibly marked and rendered in memory; they do not allocate a number or persist an issued file. Draft PDF controls disable while there are unsaved edits.

Frozen PNG/JPEG/WebP logos are verified against their issued hashes and embedded as data URLs. WebP is converted through GD. A broken frozen logo fails visibly rather than silently substituting the current company logo. Optional absent logos are allowed; draft previews omit branding that has not yet been frozen. Remote resources, embedded PHP and JavaScript are disabled. Generation/storage errors redirect back to a recoverable shadcn message without exposing exception details.

Verification: nine feature cases cover authorization, previews, immutable fields, cache reuse/integrity, cancellation, logos, safe failure, long/escaped content, and settlement/transaction permission and reversal behavior. Live admin preview and actual browser download succeeded; guest access failed, dirty-draft controls disabled, and invoice version/balance were unchanged. Local draft ID 4 (`Résumé consultation - PDF demo`, 99.99 INR) is retained. Final one-page and seven-page draft/issued fixtures were rendered and visually inspected, including accented names, a long address, 24 lines, a multi-page description, fractional rounding, discount/taxes, long terms and payment instructions. Text bounds, page footers and final content markers passed. Temporary fixtures are isolated in `/tmp/karti-stage4-concurrency.sqlite`; samples and renders are under `/tmp/karti-stage6`. Current full-suite verification is recorded again after the remaining stages.

Remaining deployment considerations: FreeSans (the unmodified font files bundled with Perfex) is embedded in invoices, credit notes and statements. Text wrapping uses its matching metrics, and verification covers Latin accents and INR currency symbols; complex scripts need an appropriate embedded font and shaping renderer before promising full support. Production workers need writable private storage, a shared lock-capable cache and GD. PDF samples are local demos, not legal/company configuration. Stages 7 through 12 are recorded in the following entry; the user explicitly authorized completing every planned remaining stage, including optional import tooling. Actual historical data import still requires inventory, mapping and a dry run before writes.

### Remaining roadmap implemented and verified on 11 October 2026

The user explicitly authorized completing all remaining planned stages. This entry supersedes the earlier “next stage” notes. The implementation covers the native customer/invoice workflow, financial extensions and guarded import tooling; it does not add unrelated Perfex CRM modules or transfer an unspecified historical database.

#### Stage 7 Invoice email and delivery history

Primary references under `modules/billing/`:

- `src/Actions/QueueInvoiceDelivery.php`: validates the issued lifecycle under an invoice lock, deduplicates the request key/details, records recipients/subject/message, freezes the exact private PDF path/hash/name, creates a dedicated private invoice link and dispatches after commit to `billing`.
- `src/Models/InvoiceDelivery.php`: delivery ledger; private attachment descriptors and link URL are hidden. The URL is encrypted. Records include kind, occurrence key, snapshot version, requester, queued/sending/sent/failed/uncertain/skipped states, timestamps and transport reference when available.
- `src/Jobs/DeliverInvoice.php`: three bounded worker attempts for pre-send failures, immediate eligibility recheck, attachment integrity check, compare-and-set sending claim, scoped application of saved email settings through `Modules\Settings\Support\EmailConfiguration`, transport acceptance and activity recording.
- `src/Mail/InvoiceEmail.php`, `resources/views/mail/invoice.blade.php`: escaped message body, optional private link and the saved PDF bytes as an attachment.
- `src/Http/Controllers/InvoiceDeliveryController.php`: `POST /admin/invoices/{invoice}/send`; invoice view plus `send invoice`, up to ten RFC-valid recipients and a subject without newline header injection.
- `resources/js/components/invoice-delivery.tsx`: shadcn recipient/message dialog and delivery history. An intentional resend opens a new request key and creates another attempt. History refresh does not resend.
- Migrations `160000`, `160100`, `230000` and `240000` define the delivery ledger, permission, provider reference and queued snapshot version.

Mail transport acceptance is not proof that a recipient's inbox received the message. A worker recovery finding an old `sending` state marks the outcome uncertain; transport exceptions also stop automatic resend. This avoids treating a possible SMTP acceptance followed by a connection/process failure as permission to send another copy. An operator checks provider history and explicitly starts a new attempt. Draft/cancelled invoices cannot be sent; cancellation after queueing skips the delivery. Email-specific activity and recipient details require send access.

The local admin queued a clearly labelled demo attempt; a fake mail transport consumed it and history showed accepted. No external customer email was sent. Attachment identity and idempotency were covered by feature tests. `config/horizon.php` includes `billing` in the default supervisors; both Composer development commands listen to `billing,default`.

#### Stage 8 Private invoice links

Read `Actions/ManageInvoiceLinks.php`, `Models/InvoiceLink.php`, `Http/Controllers/InvoiceLinkController.php`, `Http/Controllers/PublicInvoiceController.php`, `resources/js/components/invoice-links.tsx` and `pages/public-invoice.tsx`.

Creation/revocation require invoice view and `share invoice`. Tokens contain 32 random bytes; only their SHA-256 hashes are stored in link records. The newly created URL is returned once through the creator's session; dedicated email URLs are retained encrypted on delivery attempts. Expiry is 1–365 days, with a default 90-day email/link lifetime. A valid token resolves exactly one currently issued invoice. Invalid, expired, revoked, draft and cancelled resources fail closed.

`GET /billing/invoices/{token}` exposes a minimized customer-facing projection: no administrator navigation/actions, internal notes, customer database ID, invoice database ID, version, contact roster, service/preset IDs or private logo-storage descriptor. The page shows exact current settlement and the saved invoice document. `?pdf=1` returns an authorized private PDF without registration or payment actor/reference details. Responses use private/no-store, noindex/nofollow/noarchive, no-referrer and nosniff controls. Existing traffic logging is restricted to its route allowlist and does not record these bearer-token routes.

Feature tests and the live admin/guest walkthrough covered minimized props, PDF access, token expiry, lifecycle restrictions, permissions, enumeration failure and revocation. Test link tokens were never printed in the verification results.

#### Stage 9 Reminders

Read `Settings/BillingAutomationSettings.php`, `Console/Commands/QueueInvoiceReminders.php`, `Http/Controllers/BillingAutomationController.php`, `Jobs/DeliverInvoice.php` and `pages/automation.tsx`.

Reminders start disabled. Configured offsets default to due day and 3, 7 and 14 days after due date. Settings accept up to ten distinct offsets from 0–365; enabling/updating an enabled policy requires send permission as well as billing-settings update access. Per-invoice opt-out requires `remind invoice`. Dates are interpreted in the business timezone. Draft/cancelled/settled invoices, opted-out records and invoices without saved billing recipients are excluded.

`billing:reminders` runs hourly. Its occurrence key combines invoice ID, saved due date and offset. The invoice lock and unique occurrence constraint protect repeated/overlapping runs. A queued reminder rechecks global enablement, opt-out, lifecycle, settlement and queued invoice version immediately before transport. A changed snapshot is skipped instead of emailing stale balance information; the same offset is not silently duplicated. Manual sends retain their explicitly chosen attachment even when later payments update the invoice. Missing attachments fail visibly; uncertain transport outcomes use the Stage 7 conservative recovery policy.

Tests freeze time across the UTC/Asia-Kolkata date boundary and cover duplicate runs, due-day eligibility, excluded states, post-queue payment/opt-out/global disablement and stale snapshot skipping. The admin inspected the settings/opt-out controls live. Global reminders remain disabled in the local demonstration.

#### Stage 10 Verified provider payments and consultation association

Read `Contracts/PaymentProvider.php`, `Services/DodoPaymentProvider.php`, `Actions/CreateInvoiceCheckout.php`, `Services/ReconcileProviderPayment.php`, `Jobs/ProcessProviderEvent.php`, `Http/Controllers/ProviderWebhookController.php`, `Http/Controllers/OnlinePaymentsController.php`, `Models/OnlineCheckout.php`, `Models/ProviderEvent.php` and `Console/Commands/ReconcileOnlinePayments.php`. The existing Dodo SDK is used behind an adapter; the application never accepts browser return query parameters as payment evidence.

Provider setup is in `Settings/BillingProviderSettings.php` and `pages/online-settings.tsx`. It starts disabled. A dedicated invoice product must support exact tax-inclusive pay-what-you-want pricing, the invoice currency, no discount and no purchasing-power adjustment. The provider adapter validates those properties and minimum price before requesting checkout. Quote amounts come from the locked remaining balance, including applied credits. Existing pending quotes for that balance are reused; provider requests carry an idempotency key. Future-dated invoices cannot begin checkout before their invoice date. Returned hosted URLs must be HTTPS Dodo subdomains.

Dodo's Merchant of Record role makes document/tax ownership a real integration boundary. The operator must explicitly confirm that policy before enabling Karti invoice checkout; the application does not automatically create a second business invoice for a consultation payment. Official references: [Dodo webhook verification and retries](https://docs.dodopayments.com/developer-resources/webhooks), [Dodo integration guide and return-URL boundary](https://github.com/dodopayments/skills/blob/main/dodo-payments/checkout-integration/SKILL.md). The installed SDK's `CheckoutSessions/ProductItemReq.php` and `Products/Price/OneTimePrice.php` document custom-amount and tax-inclusive product requirements.

`POST /billing/webhooks/dodo` is a bounded, throttled endpoint verified with the Standard Webhooks implementation used by Dodo's SDK. Configure `DODO_PAYMENTS_WEBHOOK_KEY`; raw unverified payloads do not create records. Verified event IDs are unique and payloads are encrypted at rest. Processing refetches the payment through the authenticated provider API, checks successful state, exact identity, quoted amount, currency and stored checkout metadata, then records one payment with unique provider/payment ID. Pending/failed/mismatched/refunded outcomes do not newly settle an invoice. An additional successful charge against an already-recorded checkout is flagged for review instead of silently sharing the first ledger receipt. Refund events require accounting review; they are not treated as new payments or blindly reversed cash receipts.

The payment-return page is read-only and stays pending until verified processing records the payment. The reconciliation page exposes checkout/event state and useful references to authorized financial staff. `billing:reconcile-payments` runs every five minutes, recovers pending checkouts and retries failed/pending event work. A verified charge that cannot fit the current invoice balance/lifecycle is held for review rather than overpaying the ledger. Provider payments cannot be corrected through the manual-payment reversal action; use the credit/refund workflow.

Consultation changes are in `modules/frontend/src/Http/Controllers/BookingsController.php`, `Models/ConsultationBooking.php`, `Http/Controllers/Admin/ConsultationBookingsController.php`, `Console/Commands/ExpireStaleBookingsCommand.php`, `routes/web.php` and `resources/js/pages/admin/bookings.tsx`. Returns require an opaque token and do not confirm payment or create calendar appointments. Creation stores the provider-derived expected amount/currency; verified matching payment metadata is required before the calendar operation. Calendar creation uses a sending claim and uncertain outcomes require review instead of blind duplicate booking. Expiry skips verified-paid pending bookings. Customer association is chosen explicitly by an authorized operator, never by automatically merging equal email addresses. Existing legacy bookings lacking expected payment evidence require reconciliation rather than being trusted solely because their old status says confirmed.

Provider feature tests cover success, wrong amount/currency, pending/failed/cancelled state, signed/spoofed webhooks, replay, two different charges on one checkout, refund-before-reconciliation, and protected read-only consultation/payment returns. Provider transports are faked for local verification. Real sandbox/live acceptance still requires the business's configured product, API/signing keys, document policy and HTTPS webhook endpoint; those values were not invented or enabled.

#### Stage 11 Recurring invoices

Read `Models/RecurringInvoice.php`, `Policies/RecurringInvoicePolicy.php`, `Services/RecurringInvoiceGenerator.php`, `Console/Commands/GenerateRecurringInvoices.php`, `Http/Controllers/RecurringInvoicesController.php` and `pages/recurring/{index,form}.tsx`.

A definition stores a copied invoice template, source/owner, interval/every, anchor/next date, timezone, due interval, finite/unlimited cycles, active state, optimistic version and generation policy. Defaults create drafts and keep a new schedule inactive until explicitly enabled. Automatic issue/send requires the corresponding permissions at configuration and again during generation. Current company/customer details are reviewed for automatic issuance; saved prices, descriptions, discounts and taxes remain copied template values, including stable item keys for deterministic discount allocation.

`billing:recurring` runs hourly and catches up oldest first, at most twelve occurrences per schedule per run. It locks the definition (reserving SQLite's writer first), atomically creates the invoice and unique occurrence, advances the date/cycle/version and stops at the limit. Month/year dates derive from the original anchor using no-overflow arithmetic, so a January 31 anchor returns to March 31 after February. Source cancellation pauses further generation. Archived customers and revoked owner permissions block generation with useful failure history. Failed generation rolls back its invoice/number and can recover after the underlying configuration is repaired. Timing/template changes after generation require a new definition; the existing schedule can be paused or its non-timing policy edited.

Tests cover month-end catch-up, finite cycles, repeat runs, pause, revoked permissions, source cancellation and failure/recovery. Independent SQLite workers generated one occurrence under overlap. The live admin created a one-cycle demo draft schedule from invoice 4; it generated draft invoice 5 and paused at its limit.

#### Stage 12 Credit notes and refunds

Read `Models/{CreditNote,CreditAllocation,CreditRefund}.php`, `Policies/CreditNotePolicy.php`, `Actions/ManageCreditNotes.php`, `Services/{CreditTaxAllocation,CreditBalance,CreditNotePresentation,CreditNotePdf}.php`, `Http/Controllers/CreditNotesController.php`, `components/invoice-credit-notes.tsx` and `pages/credits/{index,show}.tsx`.

Credits have their own `credits` counter, continuous `CN-000001` numbering, immutable source invoice/customer/issuer identity, currency/precision, date, reason, net/tax/total amounts, status and version. Create a draft from an issued source, review its current credit budget and explicitly issue. Issuance is idempotent, requires a current HMAC review and cannot exceed the original invoice amount less previously issued credits. Cancellation retains the number and frees the source credit budget; active allocations/refunds must first be reversed.

Credit amounts include proportional original net/tax amounts after original discounts. The server allocates exact minor units across remaining original components using largest remainders, then consumes those budgets across issued notes. This preserves the total and prevents cumulative partial-credit rounding from crediting more of a tax/net component than the original invoice contained. Preset/settings edits cannot rewrite issued credits. This is an explicit adjustment against an original invoice, not a negative manual payment or an automatic jurisdiction-specific tax engine.

Available credit equals issued face value less active allocations and active refund records. Allocation locks the credit ledger and target invoice, requires the same customer/currency and an issued target, and cannot exceed either availability or the remaining balance. Request keys prevent repeated allocation/refund records. Allocation reversal restores both credit availability and receivables and records a reason/activity. Provider cash receipts stay separate. Refund entry records money already returned; it does not call a payment provider or bank. Refunds are bounded by unused credit and valid dates, retain method/reference/reason/actor, and have auditable reversal. Incorrect draft amounts are cancelled/recreated; the draft reason can be edited with a version check.

`InvoiceBalance` now separately derives cash paid, credit applied and remaining balance. Zero balance with credit is `settled`; ordinary zero cash balance is `paid`. Customer totals add applied credit, available credit, refunds and net account balance (receivable minus available credit) without mixing currencies. Active source credits/allocations block invoice cancellation. Credit PDFs share the screenshot-derived neutral print layout and preserve original identities while showing current allocated/refunded/available values.

The live admin issued demo `CN-000001` for 20 INR, applied 10 INR (invoice balance 60 → 50), reversed it (50 → 60), recorded a clearly labelled 5 INR test refund (available credit 20 → 15), reversed that record and cancelled the demo credit. No money was refunded externally. Independent SQLite workers racing 60 and 70 INR against a 100 INR credit committed only one allocation. Tests also cover exact net/tax component budgets, immutable numbering, retries, cross-currency rejection, over-allocation/refund rejection and cancellation rules.

#### Stage 12 Account statements

Read `Services/CustomerStatement.php`, `Http/Controllers/CustomerStatementController.php`, `pages/statement.tsx` and `resources/views/pdf/statement.blade.php`. `GET /admin/customers/{customer}/statement` requires customer view plus `view statement`; `format=pdf` and `format=csv` are protected downloads.

Statements group by currency/saved precision and derive opening balance from entries before the selected period, period movements and closing balance. The ledger contains invoice charges/cancellations, cash payments/reversals, issued credit/cancellation and refund/reversal movements. Credit allocations do not subtract an already-issued customer credit twice. Positive closing balance is receivable; negative closing balance is customer credit. Original date-only transaction dates are used; timestamp-based cancellations/reversals are converted to the business date, with payment/refund reversal dates retained explicitly. Same-day ordering is deterministic. Customer archives preserve history.

The admin statement reconciled the demonstration to 60 INR. CSV export protects formula-leading descriptions; PDFs use the neutral dark-header layout, exact server strings, repeating headers and page footers. Credit/statement samples were rendered and visually inspected; character bounds, totals and footer checks passed.

#### Stage 12 Guarded import tooling

Read `Services/BillingImporter.php`, `Models/ImportBatch.php`, `Http/Controllers/BillingImportsController.php`, `pages/imports/{index,show}.tsx`, migrations `220000` and `tests/Feature/BillingImportsTest.php`.

The importer accepts a normalized JSON manifest up to 2 MiB, version 1, a source namespace, a declared field mapping/timezone, `rounding_policy: verify`, and customer/invoice/payment arrays. This is an import adapter after source inventory/mapping, not a raw SQL dump runner. Customer rows may contain mapped billing contacts. Invoice rows contain original external/customer IDs, permanent number, issued/cancelled lifecycle/dates, issuer/customer snapshots, line inputs/taxes and the original subtotal/discount/tax/total decimal strings. Payment rows reference original invoice IDs and preserve amount/currency/date/method/reference/reversal information. See the schema rules inside `review()` and the complete normalized example in the `mappedBillingFixture()` function in `BillingImportsTest.php`; no field names are inferred from portal credentials.

A dry run reports per-kind new/existing counts, errors and mapping notes. Known model fields are whitelisted. Credentials, portal accounts and unrelated fields are rejected without retaining the unsupported source file in a staged batch. Valid staged manifests are encrypted. Current supported currency precision/native calculations must exactly match original financial totals. Unsupported source adjustments, credit history, overpayments or precision differences block/requires explicit reconciliation; they are never silently rounded away or discarded. The tool currently imports the customer/invoice/payment mapping described in the original migration prompt; it does not pretend to be a universal importer for every Perfex accounting extension.

Commit requires the reviewed HMAC token and a deliberate in-product confirmation. The transaction rechecks the source/destination, creates only unmapped records, preserves original numbers/snapshots/payment associations, and records source-kind-ID/checksum mappings. Identical reruns do not duplicate rows or overwrite later application edits. A changed source record under an existing mapping fails for explicit resolution. Number collisions and unsupported rows prevent partial writes. Native numbering advances past historical numeric suffixes to avoid reusing imported numbers. No portal password/user role or publishing-module record is created.

The live admin uploaded a demo manifest and reviewed a clean dry run; the commit button remained disabled without confirmation. No historical business dataset was supplied or imported. Actual writes, replay, changed mappings, unsafe fields, rounding mismatch and invalid tokens were verified in disposable test databases.

#### Current integration and deployment checklist

- Financial navigation now includes customers, invoices, payments, credit notes, recurring invoices and reconciliation. Settings includes billing identity/catalogue, reminders, online provider setup and import tooling. Each entry is capability-filtered. All new controls/panels use shared shadcn components; native table/confirmation/select replacements were used where necessary, including the booking association table.
- Issued/cancelled internal notes have a separate authorized version-checked update action and audit event. The financial amounts/identities stay locked and notes remain excluded from customer pages/PDFs.
- All migrations are applied to the local SQLite database. Run migrations on the deployment database, grant the intended billing permissions and verify invoice/credit sequence baselines before issuing real documents.
- Configure the real single-company billing identity, addresses/countries, currency, logo, terms and bank/payment instructions. Demo records are not business configuration.
- Configure and test saved SMTP/Resend settings. Start a worker processing `billing,default`; Composer development commands and Horizon default supervisors now include that queue. Horizon additionally requires a configured Redis-backed queue. Standard deployment worker example: `php artisan queue:work --queue=billing,default --tries=3`.
- Run Laravel's scheduler every minute (`php artisan schedule:run`) using the intended server timezone/environment. The provider registers hourly recurrence/reminder commands and five-minute payment reconciliation. Reminders/online checkout remain disabled until explicitly configured; the demo recurring schedule is already paused at its finite limit.
- Set production `APP_URL` to the HTTPS origin before creating emailed links/provider callbacks. Set provider API/test-mode/signing configuration, exact-price product and documented issuer/tax policy. Real provider/email acceptance was not simulated as a live external success.
- Keep writable private storage, GD, shared lock-capable cache and queue infrastructure. Back up issued snapshots, sequences, financial ledgers and private document/attachment files together. Do not delete stored attachments already referenced by delivery records.
- SQLite concurrency was tested for numbering, competing/repeated payments, credit overspend and duplicate recurrence. Verify equivalent row-lock behavior on the actual MySQL/PostgreSQL deployment engine before real use.

#### Final local verification record

The full PHP suite, client/SSR builds, scoped frontend formatting/lint, PHP formatting and shared navigation/unsaved-change checks are the completion gate. Test reports live under `/tmp/karti-complete-*`; browser results are `/tmp/karti-roadmap-live-result.json`, and worker-race results are `/tmp/karti-ledger-race-results.json`. Screenshots/PDF samples are `/tmp/karti-stage6`. Tests use a 512 MiB PHP memory limit because the repository's disposable-email dependency exceeds its default test limit. The repository-wide TypeScript command still contains its pre-existing diagnostics outside billing; no new billing/booking compiler errors remain.

Retained local records: cancelled invoice 2; issued invoice 3 with 40 INR cash paid and 60 INR remaining; source PDF demo draft 4; one generated recurring draft 5; cancelled credit note 1 with reversed allocation/refund records; one clearly labelled fake delivery attempt; revoked demo share links; and a reviewed, uncommitted import batch. Other than these labelled local verification records and schema changes, no production database, external email recipient, bank refund, real provider payment or unspecified Perfex business dataset was changed.

Final gate on 11 October 2026: **873 PHP tests passed (4,903 assertions)**; six shared navigation/unsaved-change tests passed; client and SSR production builds passed; scoped ESLint, Prettier, Pint and `git diff --check` passed. Composer validation passed with the repository's established path-package wildcard warnings. TypeScript reports **57 unchanged existing errors outside billing/booking**, with no new diagnostics in the implemented areas.

The final browser checks additionally submitted reminder/provider settings, saved the finite schedule, opened reconciliation, edited an issued internal note and downloaded statement CSV. The note is excluded from the customer PDF. Mobile invoice/credit/import/statement pages had no document overflow or browser page errors. Demo invoice 3 still has **40 INR paid and 60 INR remaining**.

A standalone normalized demo manifest is provided in `docs/billing-import-example.json`. Read it alongside `tests/Feature/BillingImportsTest.php`'s `mappedBillingFixture()` function and the importer validator before writing any mapping. Uploading it runs a review; it is not authorization to commit real historical data. The retained local dry-run batch was not committed.

### Billing UI redesign — 11 October 2026

- Billing listing pages use the existing `Modules\Table` backend and `InertiaTableWrapper` frontend. New secured table definitions: `CreditNotes`, `RecurringInvoices`, `OnlineCheckouts`, `ProviderEvents`, and `ImportBatches`. Existing customer, invoice, payment and catalogue tables are retained. Every resource rechecks access when loaded through generic table endpoints; provider retry actions recheck eligible states.
- The settings entry is `/admin/settings/billing`. Its `section` query selects `company`, `taxes`, `automation`, `online`, or `imports`. Each section retains its own authorization and save handler. An import-only user opens the imports section without receiving company/provider settings. Older URLs remain compatible.
- `BillingSettingsWorkspace` supplies the single settings navigation and section canvas. `BillingPageContainer` uses the established platform page width and gutters; individual forms retain comfortable widths. `BillingSummary` displays financial amounts without adding currencies together.
- Sidebar items have distinct Lucide icons and active-section matching. Billing settings replaces the four separate billing settings entries. Site, media and email settings remain their existing separate platform settings.
- Issued invoice detail uses Invoice, Payments & credits, Email & sharing, and Activity tabs. Payment, credit, email, link and reminder controls retain their permission checks and existing financial actions. Summary cards use stored server totals and settlement values.
- Customer balances use per-currency cards; credit detail shows total, allocated, refunded and available amounts. Customer/service/tax forms, statement filters, settings sections and confirmation screens use the shared shadcn components.
- Regression coverage: `BillingWorkspaceTest` checks shared-table serialization, section routing and import-only permissions. Local browser verification covers 23 admin screens at desktop and mobile widths, table search/column controls, invoice tabs and settings navigation. Inline invoice line items and chronological statement ledgers remain document-oriented shadcn tables, rather than sortable resource listings.

### Guided invoice composer and simple settings — 11 October 2026

- The invoice listing opens `components/invoice-composer.tsx` in the shared shadcn Dialog. HTML GET `admin.invoices.create` redirects to the listing with `compose=1`; JSON GET supplies the authorized editor options. The existing draft edit page remains supported.
- `pages/invoices/form.tsx` is reused in embedded and standalone modes. The editor is one continuous form without tabs: customer/date/currency fields, compact draggable item rows, totals, and optional notes/terms. Optional service lookup, extra descriptions and taxes use collapsible sections. Modal action controls are portalled into a pinned footer outside the scrolling form body.
- Outside interaction never dismisses the composer or its verification view. Explicit Close and Escape require confirmation when there are unsaved changes and are blocked during a save/issue request. Canceling the confirmation keeps the editor open.
- `components/sortable-invoice-item.tsx` uses the installed dnd-kit sortable implementation. Pointer/touch handles and keyboard sorting operate on stable UUID item keys. Arrow controls remain available, and duplication creates a fresh UUID while copying exact decimal fields and tax inputs. Saved array order feeds the existing invoice calculator and PDF rendering.
- JSON store/update validate through `SaveInvoiceRequest` and return refreshed draft editor data. “Verify & review” saves before loading the existing HMAC review through JSON `issueReview`. JSON issuance still calls `IssueInvoiceRequest` and `IssueInvoice`; missing billing identity, stale versions/tokens and permission failures retain the existing protections. A successful issue response returns the permanent invoice and its detail URL. The UI never invents invoice totals or numbers.
- `InvoiceComposerTest` covers JSON authorization/options, validation without writes, exact totals and reordered items, failed issuance with missing identity, and successful reviewed issuance. Local admin browser checks cover outside-click protection, validation, actual pointer drag, keyboard drag, duplication keys, discard confirmation, saved review, and blocked issuance when the real local company settings are incomplete. Test drafts are labelled DEMO; no live invoice was issued in this UI check.
- Settings now follow the plain account-settings layout: an unboxed section menu, visible active selection, and clean form sections. Tax presets are inside billing settings rather than Business navigation. Profile/password/appearance active matching compares URL paths instead of comparing a path to an absolute URL, and includes `aria-current`.
- Customer create/edit receives supported currency options and uses a select with “Use company default”. On a new invoice, selecting a customer applies that customer's supported default currency. Changing to a different currency with existing prices requires confirmation and clears those prices rather than treating them as converted money. A saved draft keeps its explicit invoice currency.
- Ten supported currencies remain INR, USD, EUR, GBP, AUD, CAD, SGD, JPY, AED and CHF. Amounts and balances remain separate by currency; no automatic foreign-exchange conversion is performed. The local USD customer and USD 50.00 draft verified this selection and calculation flow.
- Final verification for this change: 888 PHP tests passed; client and SSR builds passed; scoped ESLint passed. The established 57 unrelated TypeScript diagnostics remain outside the changed billing and settings-layout files.

### Shared admin layout and interaction follow-up — 11 October 2026

- `modules/shared/resources/js/components/admin-page-content.tsx` is the common listing scaffold. It delegates width/gutters to `page-container.tsx` and uses a 24px gap between header and content sections. Fourteen lists (billing, articles/categories/tags, photography, projects, speaking, tools, and contact inbox) use it; the reusable services catalogue also uses it. Embedded tax settings use the same rhythm without adding a second padded canvas.
- `index-header.tsx` owns the title/action alignment and optional description spacing. Keep descriptions in its `description` prop rather than adding a sibling paragraph with independent margins. Adjust the scaffold and PageContainer to change listing spacing consistently.
- `layouts/app-layout.tsx` wraps only the page content in a 160ms opacity fade keyed by the Inertia component. Sidebar/header remain still. Search, filter, pagination and invoice preview query updates do not remount the wrapper. `prefers-reduced-motion: reduce` disables animation. The CSS is in shared `app.css`.
- Reconciliation with no checkout/event activity presents one compact setup panel. It avoids showing empty tabs, duplicated offline banners and oversized empty boxes. Existing provider records or active searches/filters retain the checkout/event tables and retry controls. Provider configuration and financial authorization are unchanged.
- Admin and auth colors are neutral shadcn-style tokens scoped to `.admin-workspace` and `.admin-auth`; public site colors stay independent. Login shows email and password together, checks account passkey availability after email entry and offers passkey authentication only when supported and available.
- `billing-create-modal.tsx` embeds the existing customer/service/tax/recurring forms, tracks unsaved changes and uses the `X-Billing-Modal` header for list redirects. Contacts use a guarded dialog in customer detail. Outside clicks do not dismiss these editors.
- Invoice creation is a continuous form with compact draggable rows and optional details, no editor tabs. `invoice-side-panel.tsx` renders selected invoices next to the list on desktop and in a Sheet below 1024px. The chevron toggle explicitly hides/reopens the last invoice while preserving filters. `PreserveInvoicePanel` keeps mutation redirects in the list workspace. Legacy direct detail/edit routes remain compatible.
- Shared table filters use compact readable chips, direct option lists and plain sortable headings. Base collection emptiness differs from filtered no matches; the latter offers Clear search & filters. Empty results hide pagination. `hasRecords` is derived from the authorized base query and includes archived records where soft deletes apply.
- **Git packaging:** `modules/table` is a separately versioned submodule. Its changed PHP/React code and tests must be included in a future submodule commit, then the parent pointer updated. A parent-only commit cannot package those changes. No commits were created for this UI work.
- Live admin checks cover uniform page geometry, invoice preview hide/show, preserved searches, responsive invoice Sheet, payment dialog, internal-note save/restoration, creation dialog loading/outside protection, single invoice form, provider settings clipboard, first-use empty state versus no matches, and statement emptiness. Local online provider credentials are still unconfigured; no external charge or email was triggered by these checks.
- Final verification for this follow-up: **899 PHP tests passed (5,041 assertions)**, two filter-label tests passed, client/SSR production builds passed, scoped ESLint/Prettier/Pint and whitespace checks passed. TypeScript retains 57 pre-existing diagnostics outside the changed areas. Passkey availability presentation was additionally tested with mocked status responses; actual password login used the local admin account, and no passkey credential prompt was invoked.

### Invoice tabs and preview motion — 11 October 2026

- Added `@ark-ui/react` and the reference-based `modules/shared/resources/js/components/ui/tabs-component.tsx`; `demo.tsx` contains its outline variant. The modular shadcn configuration already maps `ui` to `@shared/components/ui`, so a duplicate root `/components/ui` is unnecessary. Tailwind and TypeScript are already installed. Both reference examples use platform theme tokens rather than hardcoded gray/white values; real tabs are supplied as `{ value, label, content }` props. No image assets or additional providers are needed.
- `ContentTabs` uses Ark's tab root/list/trigger/content and animated indicator. Invoice sections are permission-driven: Invoice, Payments & balance, Credit notes, Email & sharing, Activity and Internal note. Lazy mounting retains a section after its first visit, preventing draft inputs from being discarded when switching tabs. Narrow screens scroll the tab bar horizontally. See the primary API reference: https://ark-ui.com/docs/components/tabs.
- `invoice-side-panel.tsx` replaces its disclosure groups with these tabs. Existing payment, credit, delivery, sharing and note components retain their authorization and server actions. “Open page” beside PDF links to the existing full invoice detail route in the same browser tab.
- Invoice index retains the last authorized selected response for 220ms during close. Desktop grid columns, gap, opacity and horizontal offset animate on preview toggle; the collapsed slot is inert. Mobile uses the Sheet's existing entrance/exit animation, with explicit open state. Reduced-motion preference disables grid, indicator and content motion. Route/query changes still preserve list filters and exact stored amounts.
- Verification: local admin browser checks passed for all visible tabs, keyboard navigation, full-page link, animated hide/reopen, mobile Sheet, dark theme, and reduced motion. Existing global reduced-motion CSS forces transitions to 0.01ms. Payment dialog and internal note save/restoration still pass within the tab view. Eight targeted PHP integration tests and client/SSR builds passed; scoped lint and whitespace checks passed. The 57 unrelated pre-existing TypeScript diagnostics remain unchanged.

- Reference-style correction: the user requested the supplied component itself rather than the indicator adaptation. `TabsBasic` and `TabsOutline` now preserve the supplied wrappers, colors, labels and trigger classes. Reusable `ContentTabs` applies those same basic/outline trigger styles to invoice content; it keeps a horizontally scrollable tab bar and permission-driven sections. The moving indicator and its CSS have been removed. Invoice toggle animation and Open page remain unchanged. This supersedes the previous notes about token-based example colors and an animated tab indicator.

### Joined invoice navigation and compact financial sections — 11 October 2026

- Latest user reference supersedes both Ark tab styles in invoice screens. `ui/tabs-in-cell-for-navigation.tsx` now implements joined bordered shadcn/Radix tabs with Lucide icons, active muted background and bottom underline, plus horizontal ScrollArea/ScrollBar. `ContentTabs` is re-exported by `tabs-component.tsx` for compatibility; original supplied Ark examples remain available separately. No additional dependency was needed for the latest reference.
- Side-pane tabs sit above its invoice/status/PDF/Open page toolbar. Full-page invoice navigation uses the same component. Payments, Credits, Notes and Reminders have separate sections; reminder actions no longer create a footer under every tab.
- Invoice success messages use `invoice-notification.tsx`: a single Sonner notification at bottom-right, dismissible and expiring after 2.5 seconds. It is mounted by invoice index/full-page view, not in the invoice preview document. Error and persistent informational feedback remain inline where actionable.
- `InvoicePayments`/`PaymentHistory` and `InvoiceCreditNotes` accept `embedded` for border-free pane rendering while retaining their standalone card presentation elsewhere. Payment sections have a consistent 24px gap, compact monetary labels and explicit empty history; Credits shows an icon and explanation when its authorized list is empty.
- Browser verification covers joined underline styling, top toolbar order, empty payment/credit states, reminder preference change and restoration, transient toast outside the pane and expiration, every tab, keyboard navigation, full-page link, mobile/dark views, and retained preview motion. Payment dialog and note save/restoration still pass. Client/SSR builds, scoped lint/format checks, and eight PHP integration tests pass. TypeScript retains the 57 unrelated existing diagnostics.

### Final spacing and surface cleanup — 11 October 2026

- The latest user direction supersedes the joined-cell design: tabs now sit outside the content surface, use intrinsic label widths (no stretched cells), have a full-width top/bottom divider and an active bottom underline. The tab strip and content surface share a common width; their gap is 8px. Side-pane invoice number and status sit on one row. Toolbar and invoice document both use 16px padding.
- Full-page invoice now uses `AdminPageContent`, a single header/action row, a compact summary, and the same `InvoicePreview` as the side pane. Nested Issued by/Bill to cards have been removed from this screen. Cancelled summaries label the preserved amount as Cancelled amount rather than collectible Amount due.
- Shared `ui/alert.tsx` destructive variant now uses shadcn `bg-card`, `text-destructive` and `border-destructive/30` tokens instead of white destructive-foreground text on an unspecified surface. `BillingFeedback` supports a title; cancellation uses a semantic destructive alert with its reason. Transient success notifications remain outside page flow.
- `stat-summary.tsx` centralizes border-free, compact muted tiles. Contact inbox counts and billing summaries reuse it; long horizontal and vertical metric dividers are removed. The existing contact protection alert colors and configuration behavior remain unchanged.
- Latest admin browser checks passed for full-page/tab surface width alignment, cancellation alert color consistency, border-free contact counts, empty payment/credit states, reminder notification expiry and restored preferences, keyboard tabs, invoice preview toggles/full-page link, and mobile/dark views. Client/SSR builds and scoped lint/format checks pass; eight targeted PHP integration tests pass. The known 57 unrelated TypeScript diagnostics are unchanged.

### Invoice modal redesign and direct draft editing — latest approved direction

- The user rejected the split/toggle design. The invoice index now always renders the full table; old compact column projection, preview toggle, split-grid CSS and `invoice-side-panel.tsx` have been removed. `selectedInvoice` remains an authorized deep-link response used by `invoice-preview-dialog.tsx`.
- The preview is a shadcn Dialog with a pinned header/footer and scrollable paper invoice. It contains no management tabs. Header and footer share `bg-card`; the document surround uses `bg-muted/40`. Footer controls are 32px high. Full details opens in a separate browser tab, preserving the original list context. Draft editors use the same neutral modal surfaces and lighter overlay.
- Table rows use a compact 28px ellipsis menu instead of large Open buttons. Existing row/number navigation opens the preview. Permission/state-aware custom action IDs expose Preview, Full details, Download PDF, Payment history, Email & sharing and Edit draft. Payment/sharing shortcuts open the matching details tab; PDF uses the existing authorized document route. Draft edit actions do not expose issued-only operations.
- `Invoices.php` defines actions and row visibility using existing Gates. Frontend custom handlers only navigate or open editors; controllers remain authoritative. `modules/table/resources/js/RowActions.tsx` now uses shadcn popover/accent tokens instead of hardcoded black/white dropdown styles. The table remains a dirty submodule that must be committed separately when packaging these changes.
- HTML `/admin/invoices/{id}/edit` now opens the shared editor through `/admin/invoices?edit={id}` for list-authorized staff. Index validates/authorizes the edit query and excludes a simultaneous preview. JSON edit options stay on the existing endpoint. Staff with update permission but no list permission use `pages/invoices/editor.tsx`, the same modal without revealing table data. Issued edit requests still return 409; unauthorized updates remain forbidden.
- Closing a direct editor removes edit/compose query parameters. Saved table refresh completes before the parent close/navigation callback, preventing competing visits from leaving the old edit URL active. Draft headings use Edit invoice/Draft. The old standalone draft form is still reused as an embedded form and as the legacy read-only draft response.
- Live admin checks cover preview entrance/close, unchanged list width and filters, matching header/footer colors, mobile/dark layouts, new-tab full details, payment/note dialogs, compact controls, PDF download, section shortcuts, draft menu visibility, the user's `/admin/invoices/7/edit` deep link, outside-dismiss protection, and saving/closing its existing USD50 demo draft. No issued financial amounts or external payment/email operations were changed.
- Backend verification: 901 PHP tests passed (5,083 assertions); client/SSR builds passed. Scoped lint/format and whitespace checks passed. TypeScript retains 57 unrelated existing diagnostics. The table file additionally retains its six pre-existing explicit-any lint findings; lint with that existing rule disabled passes for the style change.

### White admin surfaces — latest color preference

- The user explicitly rejected pervasive gray backgrounds. The light admin/auth token scope now uses white for background, card, sidebar, muted and secondary surfaces. Header/chrome also uses `bg-card` and readable foreground/muted-foreground tokens rather than hardcoded charcoal/white classes. Accent shades remain for hover and active selection; semantic destructive/protection alert colors remain intact. Public-site palette is untouched; the optional dark theme still uses its existing dark tokens.
- Invoice preview header/footer/document surround are all `bg-card`. Paper shadow was removed. Summary tiles use white `bg-card` with no filled gray emphasis. Editing dialogs also use white header/body/footer and the same lighter overlay as previews. Preview/table menu controls remain compact.
- Admin live checks confirmed white header/sidebar/base, matching white preview surfaces, white editor and contact summaries, mobile layout, and availability of dark mode. Client/SSR builds and scoped lint/format checks passed. The latest backend gate remains 901 passing tests (5,083 assertions); TypeScript retains 57 unrelated baseline diagnostics.

### Restored shell, semantic contrast and reusable table navigation

- The user rejected changes to the admin shell. Preserve the original dark `#252528` header and light `#f4f4f5` sidebar shown in their reference. Invoice documents/editors remain white. Do not reinterpret content-surface feedback as authorization to redesign the shell.
- Shared `status-colors.ts` and badge variants now map meaningful states to green success, amber pending/partial/warning, blue issued/information, red cancellation/error and neutral drafts/archives. Primary navigation/create/save buttons remain neutral; explicit positive financial actions can use success. Shared alerts support success/info/warning/destructive colors. Filter chips use status colors only for positive equality predicates; exclusions and arbitrary values remain neutral.
- Table badge renderers now preserve semantic variants instead of coercing success/info/warning to neutral styles. Customer/catalogue status columns are badges. Payments, recurring schedules, invoice/credit statuses and online events use their proper semantic states. CSS neutral overrides on success badges/buttons were removed.
- Invoice number appears only in the page/modal heading; the document body no longer repeats a second large title/number/total header. A charcoal item-table header provides contrast. Zero discount/paid/credit rows are omitted where they convey no activity, and the final outstanding/settled/cancelled amount has a semantic highlight. Exact totals continue to come from the server.
- Full details uses a bounded main document column and a compact balance side summary. Short tabs have small record counts and distinct icons. Header PDF/download/more controls are 32px icon buttons with accessible labels and tooltips. Horizontal tab strips suppress unnecessary vertical scrollbars.
- Shared table toolbar/status presets are implemented in the table submodule. Read `modules/table/docs/tabs.md` for the programmatic PHP/React API. Customer All/Active/Archived and invoice All/Drafts/Issued/Cancelled tabs apply declared filters atomically. Quick customer-type/currency filters have configurable all-option labels. Facet counts retain search, unrelated filters and authorized base scopes.
- All enabled filter chips remain visible, including those represented by a selected tab or quick selector. This fixes the user's URL-loaded `archived_at=active` filter disappearing from the interface. Removing its chip selects All and overrides the default filter; selecting Active restores the chip. True empty collections hide the toolbar/tabs, while no-match views retain recovery controls.
- The six new table facet tests pass. The full backend suite passes 907 tests (5,096 assertions). Builds and scoped lint/format checks pass. After replacing redundant toolbar rendering, 55 unrelated existing TypeScript diagnostics remain; no new diagnostics remain in the new toolbar or invoice UI files.

### Single-column invoice details and sharing modal — 11 October 2026

- Latest user feedback removes the standalone amount/balance sidebar. Full details now uses one content column. Compact invoice date, due date and currency appear beneath the customer in the page header, available on every tab. The Overview document does not repeat this metadata; modal previews still include it. Exact financial values remain in Overview and Payments.
- `ContentTabs` owns the panel inset (`p-5 sm:p-7`, 20px on narrow screens and 28px from the small breakpoint), configurable through `contentClassName`. Individual invoice tabs no longer add their own padding. Overview uses the embedded `InvoicePreview`; Payments and Credits use their existing border-free modes; Activity now has an embedded section with no second card. Notes follows the same panel inset. Standalone component defaults are retained.
- Sharing is removed from the page tab strip. More actions → Email & sharing opens `invoice-sharing-dialog.tsx`: a bounded, scrollable shadcn dialog with white header/body/footer, border-free private-link and email sections, and the existing per-invoice reminder preference as a labelled switch. Existing permission gates, link expiry/revocation, queued email form, delivery history and reminder routes remain authoritative. Closing restores focus to More actions.
- Legacy `?tab=sharing` navigation opens this modal on Overview; closing removes that query using an Inertia client replacement. Invoice preview Full details and table section shortcuts navigate in the current browser tab, superseding older notes about opening a new tab. PDF preview retains its document-preview behavior.
- Browser checks cover identical padding across all five tabs on desktop/mobile, no amount sidebar or nested bordered cards, header metadata, unchanged cancelled/partial amounts, sharing from Actions and legacy URLs, payment/email form opening without submission, and modal viewport/focus behavior. No invoice data or external emails are changed by these checks. Seventeen existing link, delivery and reminder integration tests pass (87 assertions); client/SSR builds and scoped lint pass. The 55 unrelated TypeScript diagnostics remain outside these files.
