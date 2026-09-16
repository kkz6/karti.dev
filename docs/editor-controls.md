# Editor controls

All content editors use the shared header, publication control and sidebar canvas. Use the existing green accent; reference screenshots inform structure and spacing, not branding.

## Typography

Admin UI uses Inter for body text, headings and form controls, including menus and dialogs portaled to the body. The font tokens apply only while `.admin-workspace` is mounted, so navigating back to the public site restores Geist and Space Grotesk. Code retains the monospace font. Inter uses the existing Google Fonts loader with variable normal/italic weights and `display=swap`.

## Form fields

The category selector defines the baseline: 36px single-line height, 14px text, 12px horizontal padding, `border-input`, `bg-card`, `rounded-md` and a subtle shadow. `ui/control.ts` provides the surface and `controls.css` owns the height token. `Input`, `SelectTrigger` and `Textarea` share this surface; textareas remain multiline. Avoid per-page control sizing overrides.

Use `Button variant="control"` for calendar or selection triggers. Buttons with `role="combobox"` automatically use this variant unless an explicit non-outline variant is requested. Focus, disabled and validation states remain visible in both themes.

## Action buttons

Admin actions use one size: 36px high, 14px medium text, 12px horizontal padding, 8px icon gap, 16px icons and the shared `rounded-md` radius. Icon-only actions are 36px square. `buttons.css` owns this geometry through action tokens tied to the existing control height. Do not add height or padding overrides in listing headers or individual pages. Legacy `sm` and `lg` calls are normalized inside admin, including portaled dialogs, anchors using `buttonVariants`, and table row links.

Primary actions retain the green filled variant; supporting actions use the same neutral outlined surface. Inline destructive actions use red text on that outlined surface; committed destructive confirmations may use solid red. Hover, focus, disabled and invalid states remain visible. Split Save actions preserve joined corners and their divider.

The `ui-button` marker comes from `buttonVariants`, so shared Button, pagination and AlertDialog actions participate. Public-site buttons keep their existing sizes. Calendar cells, rich-text toolbar widgets and inline text links are deliberately excluded; form controls retain `controlSurface` styling. Both themes use existing semantic tokens.

## Publishing and saving

- `ContentEditorHeader`: split Save button and entry actions. Normal Save stays in the editor; Save & close returns to the listing only after a successful response. Both paths run the same validation. The shared hook receives the original submit event so it can distinguish these actions.
- `EditorPublishedControl`: stages published/draft (or active/inactive) state. No server request occurs until Save. Archiving is staged through the entry menu and can be reversed there or by enabling Published.
- `EditorViewLink`: Visit URL for an existing record. It uses the persisted public URL, never an unsaved slug. Live Preview is intentionally omitted.
- `EditorDateField`: shared date picker, optional local time and timezone indicator, and a separately focusable clear button. Submit timed publication dates as ISO-8601 strings; date-only event fields keep their date-only representation. Clearing the date on a published entry means publish immediately on the next save. Preserve a saved date by submitting its existing value.
- The date trigger and clear action occupy separate grid columns, never an absolute overlay. Selected time and timezone sit below the trigger so narrow sidebars cannot make them overlap. The calendar opens to the saved month. `EditorTimeField` uses shadcn Select for hour, minute and AM/PM (all 60 minutes supported), preserving the local date and existing time when changing days. Arrow keys/typeahead select values; Escape closes the active dropdown before the calendar. Clear returns keyboard focus to the date trigger.
- Date popovers use the nearest dialog or `#main-content` pane as their collision boundary, with an 8px inset. They flip or scroll within the available height instead of covering the app navigation, and hide when their trigger scrolls out of view. Outside these containers they fall back to the viewport.
- `EditorRelationsField`: searchable multi-selection and removable selected rows. Do not display drag handles unless ordering is implemented and persisted.

## Accessibility and verification

Menus use Radix keyboard navigation, Enter/Space activation and Escape dismissal. Save options are native validated form submissions through named submitters. Publication controls are labeled switches. Clear/remove buttons have specific accessible names. Errors are announced above the editor even when the affected field is on another tab.

Check desktop and narrow screens, equal field heights, focused/invalid controls, draft/published/archived labels, failed Save & close staying in the editor, successful Save & close returning to the list, date clearing, and removal of the last selected tag.
# Editor panels and tabs

Admin listings use `IndexHeader` (a section icon, one h1, and right-aligned actions) inside `content-index`. Keep the existing primary action; only show view switches or menus backed by real functionality. Media Manager supplies its grid/list, folder and upload controls without changing embedded asset pickers. The shared table header owns its bottom divider; last-row border removal belongs to TableBody, never every TableRow.

Listing canvases use 24px top padding on tablet/desktop and 16px on mobile. Keep the existing horizontal padding and header-to-table spacing; do not add per-page top margins.

Inline table actions use the shared 36px action geometry from `buttons.css`; `table-actions.css` supplies their neutral outlined surface and 8px action gap. Edit links and Delete buttons have matching padding, borders and neutral backgrounds. Delete retains red text with a light red hover state; solid destructive styling is reserved for confirmation actions. Keyboard focus remains visible on links and buttons.

All content editors use the shared canvas, header, tabs, main/sidebar grid and input surfaces. Categories and Tags share `TaxonomyForm`; they have no publication toggle or invented frontend preview route.

Use `content-editor-panel` for a padded field container or `content-editor-card` for a Card with CardHeader/CardContent. Both use the same border, 12px radius and 5px neutral surround. Apply the class explicitly to nested SEO cards; do not target every nested card, which would also restyle media dialogs and previews. Tab panels start at the same vertical position.

Articles and Photography keep long-form content in a separate Content tab. Field state remains in the parent form when switching tabs. Project and Speaking SEO use `metadataOnly` because their controllers support meta title/description rather than the richer SEO relation. Taxonomy and Photography SEO relations are saved and loaded with the record.
