# Contact form integration

The public contact form is available at `/contact`. Submissions are stored before any follow-up action runs, so a temporary mail failure does not lose the message.

## Cloudflare Turnstile

Create a Turnstile widget for the site and add these values to the environment:

```dotenv
TURNSTILE_ENABLED=true
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
CONTACT_NOTIFICATION_EMAIL=hi@karti.dev
```

Use separate widgets for local, staging, and production environments. If Turnstile is not configured, the form remains protected by the honeypot, minimum completion time, and request rate limits. The contact inbox reports whether Turnstile is active.

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
