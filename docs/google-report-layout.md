# Google report loading

The Google Analytics page keeps its admin shell, index header and reporting-period toolbar mounted while deferred report data loads. Only the report body is deferred.

- Initial loading reserves the metric, traffic and breakdown panels with neutral skeletons. It never presents placeholder numbers as real data.
- A reporting-period change preserves the visible report and scroll position until the replacement arrives. The toolbar announces the update and temporarily disables the period selector.
- Shared headers, cards, buttons and semantic colors follow the admin theme in light and dark mode. Skeleton animation respects reduced-motion preferences.
- Unavailable reports show an explanation, a retry action and access to local traffic instead of a misleading zero-filled dashboard.

Google's deferred request and existing 15-minute cache are unchanged. This design does not add Google calls to login or the local dashboard.
