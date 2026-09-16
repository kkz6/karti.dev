import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../resources/css/app.css', import.meta.url), 'utf8');
const darkAdmin = css.match(/\.dark body:has\(\.admin-workspace\),\s*\.dark \.admin-workspace\s*\{([^}]+)\}/)?.[1];
assert.ok(darkAdmin, 'Dark tokens must cover the admin shell and body-level portals.');
const tokens = Object.fromEntries([...darkAdmin.matchAll(/--([\w-]+):\s*(#[\da-f]{6});/g)].map((match) => [match[1], match[2]]));

function luminance(hex) {
    return hex.slice(1).match(/../g).map((part) => {
        const value = parseInt(part, 16) / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function contrast(first, second) {
    const pair = [luminance(tokens[first]), luminance(tokens[second])].sort((a, b) => b - a);
    return (pair[0] + 0.05) / (pair[1] + 0.05);
}

test('normal and muted text stay readable across admin surfaces', () => {
    for (const surface of ['background', 'card', 'popover', 'muted']) {
        for (const text of ['foreground', 'muted-foreground']) {
            assert.ok(contrast(text, surface) >= 4.5, `${text} on ${surface}`);
        }
    }
    assert.ok(contrast('primary-foreground', 'primary') >= 4.5);
    assert.ok(contrast('destructive', 'card') >= 4.5);
});

test('input boundaries and keyboard focus remain visible', () => {
    for (const surface of ['control-background', 'card', 'popover']) {
        assert.ok(contrast('input', surface) >= 3, `Input boundary on ${surface}`);
        assert.ok(contrast('ring', surface) >= 3, `Focus ring on ${surface}`);
    }
});

test('decorative public scanlines exclude the admin', () => {
    assert.ok(css.includes('.dark body:not(:has(.admin-workspace))::after'));
    assert.ok(!css.includes('.dark body::after'));
});

test('media workspace does not paint a full-height card behind the listing', () => {
    const mediaCss = readFileSync(new URL('../../media/resources/css/media-workspace.css', import.meta.url), 'utf8');
    assert.match(mediaCss, /\.media-workspace \.media-library-panel\s*\{\s*background: transparent;/);
});
