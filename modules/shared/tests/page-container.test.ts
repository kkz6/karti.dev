import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('admin pages share one responsive width and gutter contract', () => {
    const component = read('../resources/js/components/page-container.tsx');

    assert.match(component, /max-w-\[90rem\]/);
    assert.match(component, /px-4 pt-5 pb-10 sm:px-6 sm:pt-6 sm:pb-12 lg:px-8 lg:pt-8 lg:pb-14 xl:px-10/);
    assert.match(component, /width\?: 'standard' \| 'full'/);
});

test('dashboard and editing canvases no longer declare competing container widths or padding', () => {
    const dashboard = read('../../../resources/js/pages/dashboard.tsx');
    const editorStyles = read('../resources/css/content-editor.css');

    assert.doesNotMatch(dashboard, /max-w-7xl/);
    assert.doesNotMatch(editorStyles, /max-width:\s*1440px/);
    assert.doesNotMatch(editorStyles, /\.content-index\s*\{[^}]*\n\s*padding:/s);
    assert.doesNotMatch(editorStyles, /\.content-editor\s*\{[^}]*\n\s*padding:/s);
});

test('admin index, editor, detail and settings surfaces use the shared container', () => {
    const pages = [
        '../../../resources/js/pages/dashboard.tsx',
        '../../../resources/js/pages/newsletter/index.tsx',
        '../../../resources/js/pages/seo/index.tsx',
        '../../../resources/js/pages/settings/email.tsx',
        '../../blog/resources/js/pages/index.tsx',
        '../../blog/resources/js/components/ArticleForm.tsx',
        '../../photography/resources/js/pages/createOrEdit.tsx',
        '../../projects/resources/js/pages/show.tsx',
        '../../media/resources/js/pages/index.tsx',
        '../resources/js/layouts/settings/layout.tsx',
    ];

    for (const page of pages) {
        assert.match(read(page), /PageContainer/, `${page} should use PageContainer`);
    }
});
