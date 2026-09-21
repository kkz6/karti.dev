import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the shared guard blocks page visits and browser unload only while a form is dirty', () => {
    const guard = read('../resources/js/components/unsaved-changes-guard.tsx');

    assert.match(guard, /router\.on\('before'/);
    assert.match(guard, /beforeunload/);
    assert.match(guard, /!dirtyRef\.current \|\| visit\.method !== 'get' \|\| visit\.prefetch/);
    assert.match(guard, /Discard unsaved changes\?/);
    assert.match(guard, /Keep editing/);
    assert.match(guard, /Discard changes/);
    assert.match(guard, /continueWithoutUnsavedChangesPrompt/);
});

test('content editors and editable admin settings use the shared dirty-state guard', () => {
    const pages = [
        '../../blog/resources/js/components/ArticleForm.tsx',
        '../../blog/resources/js/components/TaxonomyForm.tsx',
        '../../photography/resources/js/pages/createOrEdit.tsx',
        '../../projects/resources/js/pages/create.tsx',
        '../../projects/resources/js/pages/edit.tsx',
        '../../speaking/resources/js/pages/create.tsx',
        '../../speaking/resources/js/pages/edit.tsx',
        '../../tools/resources/js/pages/create.tsx',
        '../../tools/resources/js/pages/edit.tsx',
        '../../../resources/js/pages/settings/site.tsx',
        '../../../resources/js/pages/settings/email.tsx',
        '../../../resources/js/pages/settings/media-settings.tsx',
        '../../auth/resources/js/pages/settings/profile.tsx',
        '../../auth/resources/js/pages/settings/password.tsx',
    ];

    for (const page of pages) {
        assert.match(read(page), /<UnsavedChangesGuard dirty=/, `${page} should warn before discarding unsaved changes`);
    }
});

test('successful editor saves clear dirty state and save-and-close bypasses the guard', () => {
    const editorSave = read('../resources/js/hooks/use-editor-save.ts');
    const taxonomy = read('../../blog/resources/js/components/TaxonomyForm.tsx');
    const photography = read('../../photography/resources/js/pages/createOrEdit.tsx');

    assert.match(editorSave, /form\.reset\(form\.getValues\(\)\)/);
    assert.match(editorSave, /continueWithoutUnsavedChangesPrompt\(\(\) => router\.visit\(backHref\)\)/);
    assert.match(taxonomy, /editorSaveOptions\(event, backHref, \(\) => setDefaults\(\)\)/);
    assert.match(photography, /editorSaveOptions\([\s\S]*?\(\) => setDefaults\(\)/);
});
