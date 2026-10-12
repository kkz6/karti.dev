# Payment gateway packages

Online payment gateways are Composer packages. Laravel discovers each package's
service provider; the billing registry supplies its settings form automatically.
The included `modules/billing-dodo` package is a working reference. No application
controller or frontend changes are needed to register another provider.

## Register a package

Use a unique provider ID such as `examplepay`. A package needs PSR-4 autoloading,
a dependency on `modules/billing`, and Laravel auto-discovery metadata:

```json
{
  "name": "your-company/billing-examplepay",
  "type": "library",
  "require": { "php": "^8.2", "modules/billing": "*" },
  "autoload": { "psr-4": { "YourCompany\\ExamplePay\\": "src/" } },
  "extra": { "laravel": { "providers": ["YourCompany\\ExamplePay\\ServiceProvider"] } }
}
```

For a local package, place it in `modules/` (the application's Composer path
repository already searches `modules/*`) and require its package name from the
root project. For a published package, use `composer require` normally.

Register the gateway when the shared registry resolves:

```php
public function register(): void
{
    $this->app->afterResolving(
        \Modules\Billing\Services\PaymentGatewayRegistry::class,
        fn ($registry) => $registry->register(new ExamplePayGateway),
    );
}
```

`ExamplePayGateway` implements `Modules\Billing\Contracts\PaymentGateway`:

- `id()` returns the unique provider ID.
- `name()` supplies the settings and payment-history label.
- `providerClass()` returns an adapter implementing `PaymentProvider`.
- `fields()` returns field definitions keyed by setting name. Supported types are
  `text`, `password`, and `checkbox`, with `label`, `required`, and `default`.
- `checkoutHosts()` lists approved HTTPS checkout hosts. Exact hosts or wildcard
  subdomains such as `*.examplepay.com` are accepted.
- `verifyWebhook(Request)` verifies the **raw request signature**, timestamp, and
  payload using the provider SDK, then returns the normalized event below.

Read settings from `app(PaymentGatewayRegistry::class)->configuration('examplepay')`.
Saved settings are encrypted. Password values are never sent back to the browser;
saving a blank password field preserves the existing credential. New packages are
disabled until an administrator configures and enables them in Billing settings →
Online payments.

## Normalize the adapter's responses

`PaymentProvider` has three methods:

```php
invoiceCheckout(OnlineCheckout $checkout): array
// ['session_id' => 'provider-session-id', 'url' => 'https://approved-host/...']

checkoutPaymentId(string $sessionId): ?string
// Verified provider payment ID, or null while still pending.

payment(string $id): array
// ['id' => $id, 'status' => 'succeeded', 'amount' => 12500,
//  'currency' => 'USD', 'refunded' => false,
//  'metadata' => ['billing_checkout_id' => $checkout->public_id]]
```

`expected_minor` is an exact integer string, and `currency` is the ISO code. Send
that exact amount, with an idempotency key derived from the checkout's stable
`request_key`; never recalculate from floating-point form amounts. Include
`billing_checkout_id` in provider metadata. Query the provider API in `payment()`;
a webhook or browser redirect alone is insufficient evidence that payment succeeded.
Return the verified minor amount as an integer and normalize successful statuses
to `succeeded`; incomplete payments remain pending.

Webhooks use `/billing/webhooks/examplepay`. Normalize a successful event as:

```php
return [
    'event_id' => $verifiedEventId,
    'event_type' => 'payment.succeeded',
    'payload' => ['data' => ['payment_id' => $verifiedPaymentId]],
];
```

Refund events should use a `refund.` prefix; these are flagged for review rather
than silently altering the invoice ledger. Invalid signatures must be rejected.
Event IDs and payment IDs are unique within each provider, so independent packages
may safely use the same IDs.

## Enable and deploy

Install Composer dependencies, run `php artisan migrate --force`, build frontend
assets, and restart queue workers (`php artisan horizon:terminate` for Horizon).
Configure credentials and copy the generated webhook URL from Online payments.
Enable the driver, select it as default, confirm the document policy, and enable
invoice checkout. Use the provider's sandbox before enabling live credentials.

Each checkout remembers its provider. Changing the default affects new checkouts;
existing checkouts and verified callbacks continue using their original driver.
Disabling a driver stops new checkout creation while preserving reconciliation.
Keep packages and signing credentials installed until their outstanding payments
are fully reconciled. The namespace migration refuses rollback if another gateway
has payment history, so provider identities cannot be discarded accidentally.

Regression examples live in `modules/billing/tests/Feature/PaymentGatewayPackagesTest.php`.
They cover discovery, redacted encrypted settings, provider changes, disabled-driver
reconciliation, signature rejection, destination validation, and duplicate events.
