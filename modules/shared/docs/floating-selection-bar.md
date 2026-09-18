# Floating selection bar

`FloatingSelectionBar` is the shared visual shell for table selection actions and
Media Manager. It keeps spacing, typography, light/dark surfaces, clear-selection
controls and reduced-motion-aware entrance animation consistent.

## Props

| Prop                | Purpose                                                          |
| ------------------- | ---------------------------------------------------------------- |
| `count`             | Selected item count; zero hides the bar.                         |
| `selectionLabel`    | Optional count text, such as “All 40 selected”.                  |
| `label`             | Accessible region label; defaults to “Selected item actions”.    |
| `busy`, `busyLabel` | Show processing feedback and disable Clear.                      |
| `onClear`           | Clear the consumer's selection.                                  |
| `children`          | Direct action buttons, with existing handlers and confirmations. |

Consumers disable their action buttons while busy and reserve bottom space in
their listing. The shell does not own permissions, request state, or deletion.
Use outline icon-and-text buttons; use `destructiveGhost` for destructive actions.
Do not replace confirmation dialogs with immediate deletion.

The fixed bar wraps on narrow screens, has a bounded scrollable height, and sits
below dialogs. It slides up 1.5rem and fades in over 200ms on first selection.
Reduced-motion users see it immediately. Selection count changes do not remount
the shell or replay the entrance. Selection/processing text uses `role="status"`;
the clear button is labelled, and focus remains where the user selected an item.

## Media Manager

The bar appears only in the standalone manager, in both grid and list modes.
Picker dialogs retain their own Use selection / Cancel footer without another
floating bar. Single files expose Edit details (when editable) and Download.
Move to folder and Delete support multiple files when editing is allowed.
Deletion continues through the usage-check dialog; referenced or failed files
stay selected, and moving follows files to their destination with selection intact.
Off-page selections are resolved before the deletion dialog opens; missing files
or lookup failures stop that action without deleting a partial selection.
