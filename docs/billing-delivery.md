# Invoice email and SMS delivery

Billing settings → Delivery manages SMS drivers and invoice notification templates. The email driver card links to the existing Email settings screen for SMTP or Resend credentials and test email delivery.

## Providers

- **Twilio:** enable SMS, enter an Account SID, auth token and sender number or approved alphanumeric sender ID. Invoice text is rendered from the saved SMS template and sent through the [Twilio Messages API](https://www.twilio.com/docs/messaging/api/message-resource).
- **MSG91:** enable SMS, enter an auth key and an approved invoice template ID. Configure the due, overdue and payment template IDs before enabling those automatic SMS notices. The [MSG91 Send SMS API](https://docs.msg91.com/sms/send-sms) sends the approved provider template, not arbitrary text. Map its exact variable names to invoice fields, for example `VAR1=invoice_number`, `VAR2=amount_due`, `VAR3=invoice_link`. The message preview should mirror the approved content; sender IDs and any required template approval are managed in MSG91.

Credentials are encrypted with the application key. Saved secrets are never returned to the browser; leaving a field blank preserves its current secret. Removing a saved credential is explicit. Saving settings never sends a message. The separate test buttons send only to the recipient entered by the administrator.

## Notifications

- Use an issued invoice's **Send & sharing → Send invoice** dialog to select email or SMS. Email includes a saved PDF and private invoice link. SMS has one recipient per delivery attempt and includes a link when the configured template uses `{invoice_link}`.
- Billing settings → Reminders selects reminder channels and payment-received channels independently. Reminder offsets range from -30 to 365 days relative to the due date. `-3` means three days before the due date, `0` is the due date and `3` is three days overdue.
- Automatic notices use current, active contacts with **Receive billing notifications** enabled. International phone numbers include their country code. Contact preferences are checked again before sending; changing or archiving a contact can skip an already queued automatic notice.
- New manual and verified online payments can queue email/SMS receipt notices after the payment transaction commits. Historical imports bypass these workflows. Reversing a payment before its receipt is sent skips that receipt.
- Historical invoices retain their imported reminder opt-out. Enabling a global schedule does not wake their old reminders.

Templates support the fields displayed on the Delivery page. Amounts retain each invoice's currency precision, including zero-decimal currencies. MSG91 template IDs and variable values are frozen when an attempt is queued; provider credentials are read fresh by each worker. Changing the selected SMS driver does not silently move already queued attempts to another provider.

## Operations

Deploy the code, run `php artisan migrate --force`, and restart queue workers. Horizon's existing supervisors include `billing` and `default`; restart managed Horizon workers with `php artisan horizon:terminate`. Standard workers must listen to `billing` (for example `php artisan queue:work --queue=billing,default`). The scheduler must run `php artisan schedule:run` each minute; it queues due reminders hourly in the business timezone.

Delivery history identifies the channel, provider, requester, acceptance time and provider reference. **Provider accepted** means the transport/API accepted the request; it is not handset delivery confirmation. Provider rejection is recorded as failed. Timeouts and interrupted sends are uncertain and are not automatically retried, because a provider may already have accepted them. Check provider logs before intentionally sending again. Reusing the same request or scheduled occurrence cannot create another attempt.

Verification:

```bash
php -d memory_limit=512M vendor/bin/pest modules/billing/tests
npm run build
```

Provider tests use fake HTTP responses; no real messages are sent during automated verification.
