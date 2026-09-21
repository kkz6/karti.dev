import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const browser = read('../resources/js/components/Browser/AssetBrowser.tsx');

test('manager and tables reuse the same animated floating selection shell', () => {
    const table = read('../../table/resources/js/SelectionActionBar.tsx');
    for (const source of [browser, table]) {
        assert.match(source, /from '@shared\/components\/ui\/floating-selection-bar'/);
        assert.match(source, /<FloatingSelectionBar/);
    }
    assert.match(browser, /indexPage && browserSelectedAssets.length > 0 && \(\s*<FloatingSelectionBar/);
    assert.doesNotMatch(browser, /DropdownMenu|MoreHorizontal/);
    assert.match(browser, /indexPage \? 'media-library-panel flex min-h-0 flex-1 flex-col' : 'contents'/);
    assert.doesNotMatch(browser, /pb-24/);
});

test('media bar exposes direct actions with selection and permission guards', () => {
    const bar = browser.slice(browser.indexOf('<FloatingSelectionBar'), browser.indexOf('</FloatingSelectionBar>'));
    assert.match(bar, /browserSelectedAssets.length === 1/);
    assert.match(bar, /handleAssetEditing\(browserSelectedAssets\[0\]\)/);
    assert.match(bar, /handleAssetDownloading\(browserSelectedAssets\[0\]\)/);
    assert.match(bar, /canEdit &&/);
    assert.match(bar, /setMoveIds\(\[\.\.\.browserSelectedAssets\]\)/);
    assert.match(bar, /onClick=\{handleDeleteAssets\}/);
    assert.match(bar, /onClear=\{clearSelections\}/);
    assert.equal((bar.match(/disabled=\{selectionBusy\}/g) || []).length, 4);
});

test('deletion resolves off-page selection and retains usage protection', () => {
    assert.match(browser, /route\('media.show'\)/);
    assert.match(browser, /ids: selectedIds.join\(','\)/);
    assert.match(browser, /assetsToDelete.length !== selectedIds.length/);
    assert.match(browser, /setAssetsToBeDeleted\(assetsToDelete\)/);
    assert.match(browser, /setShowAssetDeleter\(true\)/);
    assert.match(browser, /onDeleted=\{handleAssetsDeleted\}/);
    const deleter = read('../resources/js/components/Browser/AssetDeleter.tsx');
    assert.match(deleter, /route\('media.usage'\)/);
    assert.match(deleter, /media_ids: unused.map/);
    assert.match(browser, /browserSelectedAssets.filter\(\(id\) => !deletedAssetIds.includes\(id\)\)/);
});
