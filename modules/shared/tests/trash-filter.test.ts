import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
// @ts-expect-error Node's test runner loads TypeScript directly.
import { filterQuery } from '../../table/resources/js/filterQuery.ts';

test('trash clauses survive URL serialization without a value', () => {
    for (const clause of ['only_trashed', 'with_trashed', 'without_trashed']) {
        assert.deepEqual(filterQuery({ clause, value: null }), { clause, value: null });
    }
    assert.equal(filterQuery({ clause: 'contains', value: null }), null);
    assert.equal(filterQuery({ clause: 'contains', value: '' }), null);
    assert.deepEqual(filterQuery({ clause: 'equals', value: 0 }), { clause: 'equals', value: 0 });
    assert.deepEqual(filterQuery({ clause: 'is_false', value: null }), { clause: 'is_false', value: null });
});

test('both table renderers expose trash and preserve controls for empty results', () => {
    for (const file of ['Table.tsx', 'TableComponent.tsx']) {
        const source = readFileSync(new URL('../../table/resources/js/' + file, import.meta.url), 'utf8');
        assert.match(source, /aria-label="Show active or trashed items"/);
        assert.match(source, /!trashFilter && resource.emptyState/);
        assert.match(source, /setFilter\(trashFilter, clause, null\)/);
        assert.match(source, /Trash is empty/);
    }
    const wrapper = readFileSync(new URL('../../table/resources/js/components/Table/inertia-table-wrapper.tsx', import.meta.url), 'utf8');
    assert.match(wrapper, /!resource.filters.some\(\(filter\) => filter.type === 'trashed'\)/);
});
