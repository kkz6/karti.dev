import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('all category entry forms use inline creation with the correct category store', () => {
    for (const path of ['modules/tools/resources/js/pages/create.tsx', 'modules/tools/resources/js/pages/edit.tsx']) {
        assert.match(read(path), /<CategoryPicker/);
        assert.match(read(path), /createUrl=\{route\('admin.tool-categories.store'\)\}/);
    }
    for (const path of ['modules/blog/resources/js/components/ArticleForm.tsx', 'modules/photography/resources/js/pages/createOrEdit.tsx']) {
        assert.match(read(path), /<CategoryPicker/);
        assert.match(read(path), /createUrl=\{route\('admin.categories.store'\)\}/);
    }
});

test('picker supplies an empty state and isolates category submission from the parent form', () => {
    const picker = read('modules/shared/resources/js/components/category-picker.tsx');
    assert.match(picker, /No categories yet/);
    assert.match(picker, /grid-cols-\[minmax\(0,1fr\)_auto\]/);
    assert.match(picker, /aria-label="Create category"/);
    assert.match(picker, /rounded-r-none border-r-0/);
    assert.match(picker, /rounded-l-none/);
    assert.match(picker, /event.stopPropagation\(\)/);
    assert.match(picker, /if \(submitting.current\) return/);
    assert.match(picker, /onChange\(String\(category.id\)\)/);
    assert.match(picker, /setCreated\(\(current\) => \[\.\.\.current, category\]\)/);
    assert.match(picker, /error.response\?\.status === 422/);
    assert.doesNotMatch(picker, /router\.(?:visit|reload|post)/);
});
