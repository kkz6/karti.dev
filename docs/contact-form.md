# Contact form integration

The public contact form is available at `/contact`. Submissions are stored before any follow-up action runs, so a temporary mail failure does not lose the message.

## Cloudflare Turnstile

Create a Turnstile widget for your domain and open **Site settings → Spam protection**. Save the site key and secret key, then enable Turnstile. The secret is encrypted and never returned to the settings page; leaving it blank preserves the saved value. Disable Turnstile before removing a required key.

The settings page shows saved enablement and whether both keys are configured. This is configuration status, not a live verification test; Cloudflare validates tokens when visitors submit the contact form. The inbox no longer displays a permanent configuration banner. Rate limits, the hidden spam trap and minimum completion time remain active.

On deployment, run `php artisan migrate --force`. The migration imports the existing `TURNSTILE_ENABLED`, `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` values once. Subsequent changes are managed in settings, without an environment fallback after clearing a key. Use separate widgets for local, staging and production. Notification recipients continue to use `CONTACT_NOTIFICATION_EMAIL`.

Turnstile is free and does not require the site to use Cloudflare's CDN. The browser widget is only one part of the protection: every token is also validated against Cloudflare's Siteverify endpoint on the server. See Cloudflare's [Turnstile setup guide](https://developers.cloudflare.com/turnstile/get-started/) and [server-side validation guide](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Reacting to submissions

`Modules\Frontend\Events\ContactSubmissionReceived` is dispatched after the database transaction commits. Its public `submission` property contains the saved `ContactSubmission` model. Event listeners in a module's `src/Listeners` directory are discovered automatically. A listener can react to the event like this:

```php
public function handle(ContactSubmissionReceived $event): void
{
    // Send the submission to another system.
}
```

Listeners that call external services should implement `ShouldQueue`. The built-in `SendContactSubmissionNotification` listener is queued and uses the email configuration managed in the admin panel.

Keep a queue worker running in each deployed environment so notification emails and any future submission integrations are processed:

```bash
php artisan queue:work
```
