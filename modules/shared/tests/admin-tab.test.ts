import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
// @ts-expect-error Node's test runner loads TypeScript directly.
import { adminTabUrl, readAdminTab } from '../resources/js/lib/admin-tab.ts';

const tabs = ['main', 'content', 'seo'];

test('admin tabs restore from refresh and direct links', () => {
    const url = adminTabUrl('/admin/photography/japan/edit', 'content');
    assert.equal(url, '/admin/photography/japan/edit?tab=content');
    assert.equal(readAdminTab(url, tabs, 'main'), 'content');
    assert.equal(readAdminTab('https://karti.dev' + url, tabs, 'main'), 'content');
});

test('missing invalid and tabs from other pages fall back to a visible panel', () => {
    for (const url of ['/admin/projects/create', '/admin/projects/create?tab=', '/admin/projects/create?tab=content']) {
        assert.equal(readAdminTab(url, ['main', 'details', 'seo'], 'main'), 'main');
    }
    assert.equal(readAdminTab('/admin/seo/google?tab=invalid', ['pages', 'referrers'], 'pages'), 'pages');
});

test('switching tabs preserves filters hashes and independent tab groups', () => {
    const url = adminTabUrl('/admin/seo/google?period=90d&tab=pages&panel=one#breakdown', 'referrers');
    assert.equal(url, '/admin/seo/google?period=90d&tab=referrers&panel=one#breakdown');
    assert.equal(readAdminTab(url, ['pages', 'referrers'], 'pages'), 'referrers');
    assert.equal(adminTabUrl(url, 'two', 'panel'), '/admin/seo/google?period=90d&tab=referrers&panel=two#breakdown');
});

test('history restoration and independent records use their own URLs instead of shared storage', () => {
    for (const [url, expected] of [
        ['/admin/photography/japan/edit?tab=content', 'content'],
        ['/admin/photography/india/edit', 'main'],
        ['/admin/photography/japan/edit?tab=seo', 'seo'],
        ['/admin/photography/japan/edit?tab=content', 'content'],
    ]) assert.equal(readAdminTab(url, tabs, 'main'), expected);
});

test('every active admin page tab uses the shared state-preserving hook', () => {
    const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
    for (const file of [
        '../../photography/resources/js/pages/createOrEdit.tsx',
        '../../blog/resources/js/components/ArticleForm.tsx',
        '../../blog/resources/js/components/TaxonomyForm.tsx',
        '../../projects/resources/js/pages/create.tsx',
        '../../projects/resources/js/pages/edit.tsx',
        '../../speaking/resources/js/pages/create.tsx',
        '../../speaking/resources/js/pages/edit.tsx',
        '../../../resources/js/pages/seo/google.tsx',
    ]) {
        const source = read(file);
        assert.match(source, /useAdminTab\(/, file);
        assert.match(source, /value=\{activeTab\} onValueChange=\{setActiveTab\}/, file);
        assert.doesNotMatch(source, /useState\('main'\)/, file);
    }
    const hook = read('../resources/js/hooks/use-admin-tab.ts');
    assert.match(hook, /usePage\(\)/);
    assert.match(hook, /router.replace/);
    assert.match(hook, /preserveState: true/);
    assert.match(hook, /preserveScroll: true/);
    assert.doesNotMatch(hook, /localStorage|sessionStorage|router.get|router.visit/);
    assert.match(read('../resources/js/hooks/use-editor-save.ts'), /adminTabUrl\(page.url, tab\)/);
    assert.match(read('../../../resources/js/pages/seo/google.tsx'), /period, tab: activeTab/);
});
