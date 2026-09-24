import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../resources/js/pages/newsletter.tsx', import.meta.url), 'utf8');

test('newsletter actions submit their confirmation form', () => {
    assert.match(page, /<Button type="submit" disabled=\{form\.processing\}>/);
});
