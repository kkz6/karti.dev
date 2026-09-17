# Image sizes

View **Media settings → Default image sizes** for read-only built-in sizes, format and quality. Add and edit extra presets under **Custom sizes** on the same page. Site identity and SEO defaults remain on the separate **Site settings** page. Built-in sizes cannot be edited or removed through the settings UI or API; existing saved built-in values are preserved. The built-in names are used by the UI:

| Name | Default width | Use |
| --- | --- | --- |
| `thumb` | 320 px | Admin media rows, tiles, image fields and managed project logos |
| `card` | 640 px | Public photography collections and grids |
| `content` | 1280 px | Managed images embedded in articles |

Height is automatic by default. Fit preserves the entire image; crop requires both dimensions. Neither enlarges small source images. WebP and JPEG use the configured quality; PNG is lossless. SVGs and other unsupported raster formats keep their existing rendering path.

The current built-in defaults use WebP at 80% quality. The settings page shows effective saved values, which can differ on an existing installation. Older `media-manager.conversions` recipes (240px thumb and 600px card) are not shown in the settings UI; the responsive upload pipeline takes priority over these recipes. The collapsed **Advanced compression defaults** section reads `mediable.image_optimization` and the manipulation encoder fallback directly. Exact optimizer flags remain in `config/mediable.php`, rather than the settings UI. Automatic responsive images skip the extra optimizer pass.

Uploads generate `thumb` immediately and queue other sizes. Run the application's queue worker in production. Image-editor replacement regenerates derivatives; it does not reuse stale thumbnails. Originals are never compressed or resized by this pipeline.

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
