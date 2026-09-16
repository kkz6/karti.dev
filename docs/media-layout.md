# Media Manager layout

The reference asset browser informs the hierarchy, not a separate visual theme.

- Inherit the shared `content-index` gutter and `IndexHeader` typography. Keep Inter and the admin palette.
- Keep one primary action (`Upload files`) in the heading. Put view controls and `New folder` beside search, like other listing toolbars.
- Folder breadcrumbs sit above the file table; do not add another shaded panel around the entire workspace.
- Use a white/theme-card table, a visible header divider, compact rows, and the shared 36px buttons. The border wraps the actual content, not unused viewport space.
- Place counts and pagination below the table. Long listings scroll inside the available workspace.
- Only show metadata supplied by the API. Dimensions are omitted until the API supplies them.
- Scope these layout rules to `.media-workspace` so embedded asset pickers retain their modal layout.

## Mixed grid tiles and editor focus

- Folder and file tiles share a square preview and a two-line metadata area: title, then type/file size. Long titles truncate without increasing card height.
- Failed thumbnails show a centered “Preview unavailable” state rather than broken-image alt text. Selection and actions remain available.
- Preview and title buttons support pointer and keyboard activation; selection stays on the checkbox.
- The asset editor initially focuses the dialog container, not its Close tooltip trigger. Tab still reaches toolbar actions and their tooltips; Escape still closes the dialog.

## Embedded file-drop feedback

- Both asset-field components use `AssetDropOverlay` inside a positioned, isolated field. The overlay fills existing bounds and never adds height or moves controls/thumbnails.
- A translucent theme background softens the existing contents, with a dashed border and compact centered upload instruction. It does not intercept pointer events.
- Only file drags activate feedback; moving between field children does not dismiss it. Read-only fields and open asset selectors do not accept field drops.
- Browse/upload controls and existing upload validation remain unchanged.

Validation: production build and lint on the adjusted browser, table rows, and breadcrumbs. Browser checks cover root/folder listings and grid/list switching.
