import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const styles = read('../resources/js/components/tiptap/form-simple-editor.scss');
const component = read('../resources/js/components/tiptap/form-simple-editor.tsx');
const canvasStyles = read('../resources/css/content-editor.css');

test('editor chrome follows neutral theme tokens without green tints or floating toolbar effects', () => {
    assert.match(styles, /--editor-chrome: var\(--background\)/);
    assert.match(styles, /background: var\(--card\)/);
    assert.match(styles, /border-bottom: 1px solid var\(--border\)/);
    assert.doesNotMatch(styles, /var\(--primary\)|var\(--accent\)|translateY/);
    assert.match(styles, /width: 100%/);
    assert.match(styles, /margin: 0/);
    assert.match(styles, /focus-within/);
    assert.match(styles, /focus-visible/);
});

test('editor retains formatting tools and derives footer statistics from its plain text', () => {
    for (const tool of ['UndoRedoButton', 'HeadingDropdownMenu', 'MarkButton', 'LinkPopover', 'MediaImageButton']) {
        assert.ok(component.includes(`<${tool}`));
    }
    assert.match(component, /useEditorState/);
    assert.match(component, /getEditorReadingStats\(editor\?\.getText\(\)/);
    assert.match(component, /Placeholder.configure/);
    assert.match(component, /form-simple-editor__footer/);
});

test('editing uses a light one-pixel border while toolbar keyboard focus stays distinct', () => {
    assert.match(styles, /--editor-focus-border: color-mix\(in srgb, var\(--muted-foreground\) 15%, var\(--border\)\)/);
    assert.match(styles, /box-shadow: inset 0 0 0 1px var\(--editor-focus-border\)/);
    assert.match(styles, /outline: 2px solid var\(--muted-foreground\)/);
});

test('editor pages retain the shell gutter unless their toolbar is currently stuck', () => {
    assert.match(canvasStyles, /\.admin-workspace #main-content:has\(\.content-editor \.tiptap-toolbar\[data-stuck='true'\]\)\s*\{[^}]*margin-top: 0;/);
    assert.doesNotMatch(canvasStyles, /#main-content:has\(\.content-editor\)\s*\{/);
    assert.match(styles, /position: sticky;\s*top: 0;/);
});

test('toolbar corners are squared only while displaced from their normal position', () => {
    assert.match(component, /data-stuck=\{toolbarStuck\}/);
    assert.match(component, /toolbar.getBoundingClientRect\(\).top > naturalTop/);
    assert.match(styles, /border-radius: 0\.5rem 0\.5rem 0 0;/);
    assert.match(styles, /&\[data-stuck='true'\]\s*\{\s*border-radius: 0;/);
});
