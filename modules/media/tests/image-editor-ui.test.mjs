import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const editor = readFileSync(new URL('../resources/js/components/Editor/ImageEditor.tsx', import.meta.url), 'utf8');
const save = readFileSync(new URL('../resources/js/components/Editor/SaveDropdown.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../resources/css/image-editor.css', import.meta.url), 'utf8');

test('editor keeps footer outside the scrollable responsive workspace', () => {
    assert.match(editor, /<footer className="image-editor-footer[^"\n]*shrink-0/);
    assert.match(css, /grid-template-columns: minmax\(0, 1fr\) 19rem/);
    assert.match(css, /@media \(max-width: 767px\)/);
    assert.match(editor, /image-editor-inspector[^"\n]*overflow-y-auto/);
});

test('save actions use an accessible joined menu and confirm replacement', () => {
    assert.match(save, /role="group" aria-label="Save image"/);
    assert.match(save, /DropdownMenuContent side="top" align="end"/);
    assert.match(save, /Replace the original image\?/);
    assert.match(save, /Save as a copy/);
    assert.match(css, /border-start-end-radius: 0/);
    assert.match(css, /border-start-start-radius: 0/);
});

test('crop listeners attach after the dialog image has loaded', () => {
    assert.match(editor, /\[isOpen, imageLoading, checkForChanges\]/);
    assert.match(editor, /canvas\.addEventListener\('actionend', handleActionEnd\)/);
    assert.match(editor, /canvas\.removeEventListener\('actionend', handleActionEnd\)/);
});

test('slider thumbs carry the visible adjustment label', () => {
    const slider = readFileSync(new URL('../../shared/resources/js/components/ui/slider.tsx', import.meta.url), 'utf8');
    assert.match(
        slider,
        /<SliderPrimitive\.Thumb\s+data-slot="slider-thumb"\s+aria-label=\{props\['aria-label'\]\}\s+aria-labelledby=\{props\['aria-labelledby'\]\}/,
    );
});

test('preview updates are nonblocking and prevent saving stale or failed results', () => {
    assert.match(editor, /Updating preview…/);
    assert.match(editor, /pointer-events-none absolute right-3 bottom-3/);
    assert.match(editor, /disabled=\{busy \|\| previewPending \|\| previewFailed \|\| imageFailed\}/);
    assert.match(editor, /processing=\{busy \|\| showDiff \|\| imageFailed\}/);
    assert.match(editor, /previewQueueRef.current.schedule\(filters\)/);
    assert.doesNotMatch(editor, /\.applyFilters\(/);
    assert.match(editor, /render\(filtersRef.current, false\)/);
    assert.equal((editor.match(/getCropperData\(true\)/g) ?? []).length, 2);
});
