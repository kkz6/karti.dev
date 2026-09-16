import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = (path) => readFileSync(`${root}${path}`, 'utf8');

test('admin form pages use shared calendars, never native date/time inputs', () => {
    for (const module of readdirSync(`${root}modules`)) {
        const path = `${root}modules/${module}/resources/js`;
        let files;
        try {
            files = readdirSync(path, { recursive: true });
        } catch {
            continue;
        }
        if (module === 'frontend') continue;
        for (const file of files.filter((file) => file.endsWith('.tsx'))) {
            assert.doesNotMatch(
                readFileSync(`${path}/${file}`, 'utf8'),
                /type\s*=\s*["'](?:date|datetime-local|time|month|week)["']/,
                `${module}/${file}`,
            );
        }
    }
    for (const module of ['projects', 'speaking']) {
        for (const page of ['create', 'edit']) {
            assert.match(read(`modules/${module}/resources/js/pages/${page}.tsx`), /<DateField \{\.\.\.field\}/);
        }
    }
});

test('date field preserves form accessibility and date-only semantics', () => {
    const field = read('modules/shared/resources/js/components/date-field.tsx');
    assert.match(field, /includeTime=\{false\}/);
    assert.match(field, /triggerProps=\{triggerProps\}/);
    assert.match(field, /formatDateOnly/);
    const editor = read('modules/shared/resources/js/components/editor-date-field.tsx');
    assert.match(editor, /triggerProps\['aria-invalid'\]/);
    assert.match(editor, /triggerProps\['aria-describedby'\]/);
    assert.match(editor, /if \(!includeTime\) setOpen\(false\)/);
});

test('pointer treatment covers semantic controls and excludes disabled states', () => {
    const css = read('modules/shared/resources/css/interactions.css');
    assert.match(read('modules/shared/resources/css/app.css'), /@import '.\/interactions.css'/);
    for (const role of ['button', 'tab', 'menuitem', 'option', 'checkbox', 'switch']) assert.ok(css.includes(`[role='${role}']`));
    assert.match(css, /cursor: pointer/);
    assert.match(css, /:not\(:disabled, \[aria-disabled='true'\]/);
    assert.match(css, /cursor: not-allowed/);
});
