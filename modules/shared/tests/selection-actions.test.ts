import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getSelectionActions } from '../../table/resources/js/selectionActions.ts';

const actions = [
    { label: 'Edit', authorized: true, asRowAction: true, asBulkAction: false, isLink: true },
    { label: 'Delete', authorized: true, asRowAction: true, asBulkAction: true },
    { label: 'Restore', authorized: true, asRowAction: true, asBulkAction: true },
    { label: 'Delete permanently', authorized: true, asRowAction: true, asBulkAction: true },
];
const hidden = { hidden: true, disabled: true };
const rows = [
    { _primary_key: 1, _is_selectable: true, _actions: { 0: '/edit/1', 1: null, 2: hidden, 3: hidden } },
    { _primary_key: 2, _is_selectable: true, _actions: { 0: hidden, 1: hidden, 2: null, 3: null } },
];

test('single selections expose row actions directly and respect trash eligibility', () => {
    assert.deepEqual(
        getSelectionActions(actions, rows, [1], 2).map(({ action }) => action.label),
        ['Edit', 'Delete'],
    );
    assert.deepEqual(
        getSelectionActions(actions, rows, [2], 2).map(({ action }) => action.label),
        ['Restore', 'Delete permanently'],
    );
});

test('mixed selections target only eligible records and preserve original action indexes', () => {
    const available = getSelectionActions(actions, rows, [1, 2], 2);
    assert.deepEqual(
        available.map(({ index, keys, partial }) => ({ index, keys, partial })),
        [
            { index: 1, keys: [1], partial: true },
            { index: 2, keys: [2], partial: true },
            { index: 3, keys: [2], partial: true },
        ],
    );
});

test('wildcard actions keep server filter scope and allow eligible off-page items', () => {
    assert.deepEqual(
        getSelectionActions(actions, [rows[0]], ['*'], 1).map(({ action }) => action.label),
        ['Delete'],
    );
    const available = getSelectionActions(actions, [rows[0]], ['*'], 20);
    assert.equal(available.length, 3);
    assert.ok(available.every(({ keys }) => keys.length === 1 && keys[0] === '*'));
});

test('unauthorized, disabled, unselectable and empty selections have no actions', () => {
    assert.deepEqual(getSelectionActions(actions, rows, [], 2), []);
    assert.deepEqual(
        getSelectionActions(
            actions.map((action) => ({ ...action, authorized: false })),
            rows,
            [2],
            2,
        ),
        [],
    );
    assert.deepEqual(getSelectionActions(actions, [{ ...rows[1], _is_selectable: false }], [2], 2), []);
    assert.deepEqual(getSelectionActions(actions, [{ _primary_key: 3, _actions: { 0: hidden, 1: hidden, 2: hidden, 3: hidden } }], [3], 1), []);
});

test('generic tables without row metadata retain their declared bulk actions', () => {
    assert.equal(getSelectionActions(actions, [{ _primary_key: 'a' }, { _primary_key: 'b' }], ['a', 'b'], 2).length, 3);
});

test('both table renderers expose one shared selection bar and retain exports without selection', () => {
    for (const file of ['Table.tsx', 'TableComponent.tsx']) {
        const source = readFileSync(new URL('../../table/resources/js/' + file, import.meta.url), 'utf8');
        assert.match(source, /<SelectionActionBar/);
        assert.match(source, /resource.hasExports && selectedItems.length === 0/);
        assert.match(source, /onClear=\{actions.removeSelection\}/);
        assert.match(source, /className="it-wrapper relative"/);
        assert.doesNotMatch(source, /pb-24/);
    }
});

test('selection bar slides in from below only when motion is allowed', () => {
    const source = readFileSync(new URL('../resources/js/components/ui/floating-selection-bar.tsx', import.meta.url), 'utf8');
    for (const token of [
        'motion-safe:animate-in',
        'motion-safe:fade-in-0',
        'motion-safe:slide-in-from-bottom-6',
        'motion-safe:duration-200',
        'motion-safe:ease-out',
    ]) {
        assert.ok(source.includes(token));
    }
    assert.match(source, /if \(!count\) return null/);
    assert.match(source, /pointer-events-none fixed inset-x-4 bottom-5/);
});
