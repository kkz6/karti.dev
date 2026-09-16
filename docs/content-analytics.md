# Local analytics in content management

Articles and galleries have **Views (30d)** columns in their existing admin tables and a shared **Local traffic** panel in their editors. Both use the same 30-calendar-day UTC window. The view count links to a report with period selection, a daily chart, referrers, browsers, operating systems, and devices.

Projects, speaking events, and tools do not have individual public detail pages. Their admin lists and editors therefore show clearly labelled traffic for `/projects`, `/speaking`, and `/uses`, respectively. These are not item-impression or outbound-click counts.

The local SEO report's **Explore a page** control covers the static public pages, and each top-page URL opens an exact-path report. Entry-level reports can include multiple historical URL paths after a slug change.

## Data and privacy

- `page_views.content_type` (`article` or `gallery`) and `content_id` bind new view events to stable entries. No new personal data is stored.
- The migration associates existing events with currently matching article/gallery URLs. It cannot reconstruct a slug changed before this association existed; unmatched history stays in URL reports.
- Views remain deduplicated within fixed one-minute buckets. Bots, authenticated users, prefetches, partial Inertia reloads, failed responses, and privacy opt-outs are excluded.
- Visitors are the sum of daily hashed-IP estimates, not unique people over the whole reporting period. Records retain the existing 90-day retention policy.
- Editor summaries use one aggregate query. Table counts use indexed aggregate subqueries, avoiding application-level per-row queries. No Google APIs are called.

## Shared component

`LocalTrafficCard` reads the optional `localTraffic` Inertia prop. `compact` renders the same counters horizontally on list pages; the default layout fits editor sidebars. It uses existing card colors, borders, typography and outline buttons in both themes. With no prop (new unsaved entries), it renders nothing. Zero counts and disabled tracking are explicit, not replaced with sample values.

Deployment requires `php artisan migrate --force` and `npm run build`. The content association migration preserves all existing view events.
