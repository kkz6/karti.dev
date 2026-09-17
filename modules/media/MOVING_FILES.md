# Moving library files

Media Manager supports moving existing files within the current storage disk:

- Use **Move to folder** in a file's actions menu, or select multiple files and use the bulk toolbar button.
- Drag a file onto a folder in grid or table view. Dragging a selected file moves the whole selection; dragging an unselected file moves only that file.
- Parent-folder controls and ancestor breadcrumbs are also drop targets.

The folder chooser reuses the shared dialog and button components, with a labelled destination, keyboard-accessible folder buttons, disabled current-folder submission, loading feedback, and inline retryable errors. Drop targets use the existing accent and primary tokens. Successful moves open the destination folder with moved file IDs still selected. File uploads from the operating system remain separate from internal moves. Moving is intentionally unavailable inside asset-selection pickers.

The authenticated move endpoint validates the destination and checks the entire batch for missing originals and filename conflicts before moving. It never intentionally overwrites a destination file. Unexpected failures return the completed IDs so the UI retains failed selections for retry. The media record IDs, gallery selections/order, relationships, metadata, and generated variants are preserved.

Saved image URLs in article/gallery/project/tool/speaking content, project image arrays, SEO data and site settings are rewritten in the same transaction as each file's location change. Original files are moved back if this transaction fails. Soft-deleted content is included, while unrelated hosts and filename prefixes are not replaced. Existing public paths are recorded in `media_url_histories` and redirect to the latest location; old embedded image references also resolve to the same media ID for responsive thumbnails. Deleted or private files are never exposed by these redirects.

Deployment: run `php artisan migrate`. The web server must pass missing `/storage/*` requests to Laravel (standard `try_files $uri $uri/ /index.php?$query_string`); a static-assets location using `try_files $uri =404` needs the same fallback for old links. Private signed file downloads use `/private-storage/*` to avoid overriding the public redirect route. External CDN/S3 paths require equivalent origin routing; redirects here cover this application's public storage URLs. Reusing an old path for another file makes that physical file take precedence, so avoid reusing published URLs. Already-sent emails and external pages are not rewritten.

The folder endpoint lists one level at a time without loading assets or exposing the internal conversions directory. Up to 100 files can be moved in one request.
