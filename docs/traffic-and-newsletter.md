# Traffic reports and newsletter subscriptions

## Deployment

Deploy PHP changes and rebuilt assets together. The dashboard no longer sends the old analytics prop, so an old frontend bundle is incompatible with the new response.

1. Install locked dependencies (`composer install`) with package discovery enabled.
2. Run `php artisan migrate`. The new SEO and Newsletter pages need `page_views` and `newsletter_subscribers` respectively.
3. Build assets with `npm ci && npm run build`, and refresh deployment caches using the normal release process.
4. Run a queue worker for the configured queue connection and restart workers on deployment. Confirmation emails use the existing Laravel mailer. `MAIL_MAILER=log` only writes messages to logs; it does not deliver email.
5. Run Laravel's scheduler so the daily `traffic:prune` task enforces retention. Refresh the disposable-domain list periodically with `php artisan disposable:update`.
6. Verify Dashboard, SEO, Newsletter, and an actual confirmation email with a test mailbox before announcing the subscription feature. No real mail delivery was exercised by the automated tests.

## Dashboard and SEO

Dashboard has no analytics API calls or traffic queries. Local traffic is at `/admin/seo`; Google reports are at `/admin/seo/google`. Google data is deferred until after the page shell loads and cached for 15 minutes. Missing credentials and service failures produce an unavailable state, not demo statistics.

## First-party views

The tracker uses [Matomo DeviceDetector](https://github.com/matomo-org/device-detector) for bot detection and browser, OS and device classification. A small local storage layer owns deduplication and reporting. Other candidates were [Eloquent Viewable](https://github.com/cyrildewit/eloquent-viewable), geared toward model/cookie-based counts, and [Shetabit Visitor](https://github.com/shetabit/visitor), whose default request/IP storage is broader than needed here.

Successful anonymous public-page GET responses are tracked after the response. Signed-in users, detected bots, prefetches, partial Inertia reloads and DNT/GPC opt-outs are excluded. No remote geolocation API is called. Geography and session/bounce metrics are not inferred from these records.

Only the path, external referrer host, coarse device details and a daily HMAC of the client IP are persisted. Raw IP addresses, full user agents, query strings and referrer paths are not stored by this tracker. The IP hash resets each UTC day. Same IP/path requests in one fixed minute bucket count once. Shared networks undercount and changing IPs overcount; these are estimates, not unique people. Period visitor totals are explicitly the sum of daily unique estimates.

Default retention is 90 days. `TRAFFIC_ENABLED=false` disables recording. Configure trusted proxies narrowly on the deployment host; never trust arbitrary forwarded IP headers. Existing web-server logs and Google Analytics have independent data collection/retention policies.

## Newsletter

The homepage form now persists pending subscribers and queues confirmation messages. Spam defenses include CSRF, RFC/DNS email validation, [Laravel Disposable Email](https://github.com/Propaganistas/Laravel-Disposable-Email), a hidden honeypot, encrypted form timing, per-IP/per-address rate limits and resend cooldowns. These reduce abuse; they do not guarantee every address is legitimate.

Only confirmed, non-unsubscribed rows qualify as active. Signed confirmation links expire after 48 hours. GET requests show a confirmation screen; a deliberate POST confirms or unsubscribes, preventing basic email link scanners from changing status. Re-subscription requires a fresh confirmation. Signed pages do not load Google Analytics. Admin listings never expose confirmation secrets.

The Newsletter admin lists/filter-searches active, pending and unsubscribed addresses. Campaign creation and bulk sending are not part of this change. Future senders must use the model's `active()` scope and include unsubscribe links.
