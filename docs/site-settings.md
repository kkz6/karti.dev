# Site settings

Open **Settings → Site settings** at `/admin/settings`. The page uses the existing admin form components, spacing, and theme tokens. Changes are saved explicitly; the preview is live but does not publish unsaved values.

Settings are persisted by `spatie/laravel-settings` in the `site` group. The existing `site_settings` table remains intact: initial name/title/description/author values are copied when available, and unrelated legacy settings are preserved.

## Managed values

- Site name: admin branding, admin document titles, and `og:site_name`.
- Default page title: homepage title and untitled-content fallback.
- Default description and author: fallback metadata, overridden by individual pages.
- Favicon: browser icon, admin branding, and search previews. Accepts a local absolute path or HTTP(S) URL.
- Default social image and X/Twitter handle: sharing metadata defaults.

Explicit SEO metadata wins over entry content, then site defaults. SEO titles are not automatically suffixed; the client preserves the server's final SEO title. Admin titles use the saved site name without rebuilding JavaScript.

The web middleware applies public defaults before controllers run, then restores the original configuration after the response. Database settings are not resolved during application boot. Only the allowlisted public branding fields are shared with Inertia; do not add credentials to this group.

## Deployment

Run `composer install`, `php artisan migrate --force`, and `npm run build`. The two new migrations create the package table and seed settings without deleting legacy data. Later settings changes do not require a rebuild.

The page follows the existing admin access policy (`web`, `auth`, `verified`). Changes to that policy should be applied across the admin panel rather than to this page alone.
