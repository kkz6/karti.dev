# Admin dark theme

Use shared semantic colors, including in body-level Radix portals. Do not reuse the public site's decorative scanline overlay in admin.

- Canvas and inset fields: `--background` / `--control-background`.
- Raised editor cards and media tiles: `--card`.
- Menus: `--popover`, with the same readable foreground and muted text.
- Form boundaries: `--input`; structural dividers: `--border`.
- Focus and primary actions retain the green brand color.
- The media workspace wrapper stays transparent. Only its actual listing has a card surface, preventing a full-height grey block under the footer.
- SEO search/social previews follow the selected theme rather than forcing white panels.

Run `node --test modules/shared/tests/admin-theme.test.mjs` to check text/action contrast (4.5:1), field/focus contrast (3:1), portal token coverage, and workspace/overlay scoping. These token checks are not a full accessibility audit.
