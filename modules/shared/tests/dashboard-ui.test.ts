import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const dashboard = readFileSync(new URL('../../../resources/js/pages/dashboard.tsx', import.meta.url), 'utf8');

test('dashboard presents real site health instead of navigation cards', () => {
    assert.match(dashboard, /overview\.traffic\.views/);
    assert.match(dashboard, /Traffic trend/);
    assert.match(dashboard, /Newsletter health/);
    assert.match(dashboard, /Top pages/);
    assert.match(dashboard, /Content library/);
    assert.match(dashboard, /Recently updated/);
    assert.doesNotMatch(dashboard, /Choose a section to get started/);
});

test('dashboard includes empty and disabled analytics states', () => {
    assert.match(dashboard, /Local analytics is paused/);
    assert.match(dashboard, /No traffic yet/);
    assert.match(dashboard, /No popular pages yet/);
    assert.match(dashboard, /No content yet/);
});

test('top page rows keep their trailing metrics away from the container edge', () => {
    assert.match(dashboard, /py-3\.5 pr-3/);
    assert.match(dashboard, /sm:pr-4/);
});
