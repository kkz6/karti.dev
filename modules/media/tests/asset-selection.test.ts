import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { includeAsset, toggleVisibleAssets, uniqueAssetIds, visibleSelectionState } from '../resources/js/utils/asset-selection.ts';

test('select all exposes none, partial and complete states for the visible page', () => {
    assert.equal(visibleSelectionState([], []), false);
    assert.equal(visibleSelectionState(['elsewhere'], ['1', '2']), false);
    assert.equal(visibleSelectionState(['1'], ['1', '2']), 'mixed');
    assert.equal(visibleSelectionState(['2', '1'], ['1', '2']), true);
});

test('select all fills partial selections without duplicates and deselects only the visible page', () => {
    const existing = ['elsewhere', '1'];
    assert.deepEqual(toggleVisibleAssets(existing, ['1', '2']), ['elsewhere', '1', '2']);
    assert.deepEqual(toggleVisibleAssets(['elsewhere', '1', '2'], ['1', '2']), ['elsewhere']);
    assert.deepEqual(toggleVisibleAssets(existing, []), existing);
    assert.deepEqual(existing, ['elsewhere', '1']);
});

test('media header select-all uses accessible mixed state and is disabled while loading or moving', () => {
    const browser = readFileSync(new URL('../resources/js/components/Browser/AssetBrowser.tsx', import.meta.url), 'utf8');
    assert.match(browser, /aria-checked=\{allSelected\}/);
    assert.match(browser, /disabled=\{loadingAssets \|\| moving \|\| visibleIds.length === 0\}/);
    assert.match(browser, /Select all files on this page/);
    assert.match(browser, /indexPage && displayMode === 'grid'/);
    assert.match(browser, /onToggleSelectAll=\{indexPage \? toggleSelectAll : undefined\}/);
    const table = readFileSync(new URL('../resources/js/components/Browser/Listing/TableListing.tsx', import.meta.url), 'utf8');
    assert.match(table, /<thead>[\s\S]*?<Checkbox[\s\S]*?<\/thead>/);
    assert.match(table, /checked=\{selectAllState === 'mixed' \? 'indeterminate' : selectAllState\}/);
    assert.match(table, /disabled=\{selectAllDisabled\}/);
});

test('normalizes mixed saved IDs and removes duplicates without changing gallery order', () => {
    assert.deepEqual(uniqueAssetIds([3, '2', { id: 3 }, { id: '1' }, '2', '']), ['3', '2', '1']);
});

test('reopening and confirming unchanged selection never adds duplicates', () => {
    const saved = ['3', '1'];
    const draft = uniqueAssetIds(saved);
    assert.notEqual(draft, saved);
    assert.deepEqual(uniqueAssetIds(draft), saved);
    assert.deepEqual(includeAsset(draft, '3'), saved);
    assert.deepEqual(includeAsset(draft, '2'), ['3', '1', '2']);
});

test('draft changes can be cancelled, removed, or cleared without mutating saved selection', () => {
    const saved = ['3', '1'];
    const draft = uniqueAssetIds(saved);
    draft.splice(0, 1);
    assert.deepEqual(saved, ['3', '1']);
    assert.deepEqual(uniqueAssetIds(draft), ['1']);
    assert.deepEqual(uniqueAssetIds([]), []);
});

test('quick selection respects limits and replaces single-image selections', () => {
    assert.deepEqual(includeAsset(['3', '1'], '2', 2), ['3', '1']);
    assert.deepEqual(includeAsset(['3'], '2', 1), ['2']);
    assert.deepEqual(includeAsset(['3'], '3', 2), ['3']);
});

test('gallery picker starts with current IDs and confirms the draft instead of appending it', () => {
    const field = readFileSync(new URL('../resources/js/components/Field/SimpleAssetsField.tsx', import.meta.url), 'utf8');
    assert.match(field, /const openSelector = \(\) => \{\s*setSelectedAssetIds\(uniqueAssetIds\(assetIds\)\);/);
    assert.match(field, /const handleAssetsSelected = \(\) => \{\s*updateParentWithIds\(selectedAssetIds\);/);
    assert.match(field, /const uniqueIds = uniqueAssetIds\(newIds\)/);
    assert.equal((field.match(/confirmLabel="Use selection"\s+allowEmpty/g) ?? []).length, 2);
    assert.doesNotMatch(field, /\[\.\.\.assetIds, \.\.\.selectedAssetIds\]/);
});
