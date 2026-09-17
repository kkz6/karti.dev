import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../resources/css/app.css', import.meta.url), 'utf8');

test('public typography retains Geist, Space Grotesk, and JetBrains Mono in both themes', () => {
    for (const selector of [':root', '.dark']) {
        const block = css.split(`${selector} {`).slice(1).map((part) => part.split('}')[0]).join('\n');
        assert.match(block, /--font-sans: 'Geist'/);
        assert.match(block, /--font-display: 'Space Grotesk'/);
        assert.match(block, /--font-mono: 'JetBrains Mono'/);
    }
});

test('system UI and entered-text rules are scoped to the mounted admin shell including portals', () => {
    const block = css.slice(css.indexOf('/* Admin typography'), css.indexOf('/* The admin shell'));
    assert.match(block, /body:has\(\.admin-workspace\),\s*\.admin-workspace\s*\{/);
    assert.match(block, /--font-sans: system-ui/);
    assert.match(block, /--font-input: 'Inter'/);
    assert.match(block, /body:has\(\.admin-workspace\) :is\(\s*input:not/);
    assert.match(block, /body:has\(\.admin-workspace\) \.tiptap\.ProseMirror\[contenteditable='true'\]/);
    assert.match(block, /body:has\(\.admin-workspace\) input::placeholder/);
    assert.match(block, /body:has\(\.admin-workspace\) :is\(code, pre, samp\)/);
});

test('entry headings opt into admin entered-text typography', () => {
    const header = readFileSync(new URL('../resources/js/components/content-editor.tsx', import.meta.url), 'utf8');
    assert.match(header, /<h1 data-editor-title/);
});
