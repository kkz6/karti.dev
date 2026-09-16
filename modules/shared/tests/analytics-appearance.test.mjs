import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const report = read('../../../resources/js/pages/seo/index.tsx');

test('local analytics uses integrated sections and explains visitor estimates without nested cards', () => {
    assert.doesNotMatch(report, /<Card|BreakdownCard/);
    assert.match(report, /title="Local traffic"/);
    assert.match(report, /<dl /);
    assert.match(report, /Sum of daily estimates, not unique people across the period/);
    assert.match(report, /<details/);
    for (const name of ['traffic.pages', 'traffic.referrers', 'traffic.browsers', 'traffic.platforms', 'traffic.devices']) {
        assert.ok(report.includes(name));
    }
});

test('analytics filters keep the server scope, preserve the period and guard current-entry selection', () => {
    assert.match(report, /scope.path \?\? 'current-entry'/);
    assert.match(report, /value=\{selectedPage\}/);
    assert.match(report, /if \(path !== selectedPage\)/);
    assert.match(report, /nextDays === 1 \? '24h' : `\$\{nextDays\}d`/);
    assert.match(report, /htmlFor="analytics-page"/);
    assert.match(report, /htmlFor="analytics-period"/);
    assert.match(report, /aria-busy=\{updating\}/);
    assert.match(report, /disabled=\{updating\}/);
    assert.match(report, /No views recorded yet/);
});

test('select text truncates on one line while focus outlines stay on controls, not the page shell', () => {
    const select = read('../resources/js/components/ui/select.tsx');
    assert.match(select, /data-\[slot=select-value\]:min-w-0/);
    assert.match(select, /data-\[slot=select-value\]:truncate/);
    assert.match(select, /data-\[slot=select-value\]:text-left/);
    assert.doesNotMatch(select, /line-clamp-1/);
    const layout = read('../resources/js/layouts/app/app-sidebar-layout.tsx');
    assert.match(layout, /id="main-content"[\s\S]*?tabIndex=\{-1\}[\s\S]*?outline-none/);
    assert.match(read('../resources/js/components/ui/control.ts'), /focus-visible/);
});
