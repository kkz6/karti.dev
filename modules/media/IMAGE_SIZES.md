# Image sizes

View **Media settings → Default image sizes** for read-only built-in sizes, format and quality. Add and edit extra presets under **Custom sizes** on the same page. Site identity and SEO defaults remain on the separate **Site settings** page. Built-in sizes cannot be edited or removed through the settings UI or API; existing saved built-in values are preserved. The built-in names are used by the UI:

| Name | Default width | Use |
| --- | --- | --- |
| `thumb` | 320 px | Admin media rows, tiles, image fields and managed project logos |
| `card` | 640 px | Public photography collections and grids |
| `content` | 1280 px | Managed images embedded in articles |

Height is automatic by default. Fit preserves the entire image; crop requires both dimensions. Neither enlarges small source images. WebP and JPEG use the configured quality; PNG is lossless. SVGs and other unsupported raster formats keep their existing rendering path.

The current built-in defaults use WebP at 80% quality. The settings page shows effective saved values, which can differ on an existing installation. Older `media-manager.conversions` recipes (240px thumb and 600px card) are not shown in the settings UI; the responsive upload pipeline takes priority over these recipes. The collapsed **Advanced compression defaults** section reads `mediable.image_optimization` and the manipulation encoder fallback directly. Exact optimizer flags remain in `config/mediable.php`, rather than the settings UI. Automatic responsive images skip the extra optimizer pass.

Uploads queue all sizes, including `thumb`, so image decoding does not delay upload confirmation. Run the application's queue worker with an asynchronous `QUEUE_CONNECTION` (such as `database`) in production; `sync` still runs jobs inline. Until a derivative exists, its signed preview URL can generate it on demand without delaying the upload response. Image-editor replacement queues derivative regeneration. Originals are never compressed or resized by this pipeline.

Older images with missing variants use a signed, rate-limited derivative endpoint on first view. The endpoint produces a thumbnail, not a redirect to the full-size source. **Rebuild images** queues regeneration for existing raster images after changing settings. Removed preset definitions do not delete existing files.

## Using an extra size

Add a named preset (for example `hero-wide`) in settings, then use it in the page's PHP image data:

```php
$media->imageUrl('hero-wide'); // Generated derivative, or signed URL to create it
$media->getUrl();             // Original: use for explicit full-size previews/downloads
```

Media API responses also expose `image_urls` keyed by preset name, alongside `thumbnail_url` and the original `url`. A template must explicitly choose the custom preset; adding a preset does not change its layout automatically.

Article rendering resolves images registered on the public media disk in one query, uses the `content` derivative, and exposes the original only to the click-to-open viewer. External images and static assets outside the media library are not fetched or rewritten.

Deploy the media-settings migration before starting workers. Existing preset URLs change on regeneration to avoid stale browser caches. Signed fallback URLs may remain browser-cached for up to an hour.

## Photo details

Original uploads queue `ExtractPhotoMetadata` after the database transaction commits. The job stores dimensions and an allowlisted EXIF summary in `custom_properties.photo_metadata`. Opening an older asset queues extraction if needed; neither uploads nor detail requests parse EXIF inline. Media Manager shows a pending message and polls every three seconds while the job runs, updating only read-only details without changing unsaved form fields. Closing the dialog cancels polling.

Repeated requests do not enqueue duplicate pending work. Jobs retry up to three times, then expose a readable failure state. Reopening details retries failed work or pending work older than 15 minutes. Per-request tokens discard stale results and failures after an image is replaced. Replacing an image queues fresh dimensions and clears stale camera fields; metadata updates preserve the asset's modification time and other custom properties.

Camera extraction uses PHP's EXIF extension for JPEG/TIFF files; dimensions are also available for supported raster images without EXIF. Missing metadata and an unavailable EXIF extension have explicit empty states. Enable the PHP EXIF extension on the worker runtime. Use an asynchronous `QUEUE_CONNECTION` (the default is `database`) and run `php artisan queue:work`; the `sync` connection would still execute jobs inline. Restart long-running workers after deploying this job.

Only camera make/model, lens, exposure, aperture, ISO, focal length, orientation and camera-local capture time are stored. GPS, serial numbers, maker notes and comments are excluded. The summary is currently exposed only in authenticated media responses, not public gallery data. Originals remain byte-for-byte unchanged, so any sensitive metadata embedded in the original is still present in the downloadable file; excluding fields from the summary does not sanitize that file.
