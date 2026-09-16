import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('site-brand icon uses the saved browser favicon', () => {
    const icon = read('modules/shared/resources/js/components/app-logo-icon.tsx');
    assert.match(icon, /site\?\.favicon \|\| '\/favicon.ico'/);
    assert.ok(existsSync(new URL('public/favicon.ico', root)));
    assert.ok(read('resources/views/app.blade.php').includes("config('site.public.favicon', '/favicon.ico')"));
    assert.match(read('modules/shared/resources/js/components/site-identity-head.tsx'), /href=\{site.favicon\}/);
    assert.doesNotMatch(icon, /<svg/);
    assert.match(icon, /alt = ''/);
    assert.match(icon, /object-contain/);
});

test('SEO preview and admin branding share the same favicon component', () => {
    for (const path of [
        'modules/seo/resources/js/components/SeoFields.tsx',
        'modules/shared/resources/js/components/app-logo.tsx',
        'modules/shared/resources/js/components/app-sidebar-header.tsx',
        'modules/shared/resources/js/components/app-header.tsx',
        'modules/shared/resources/js/layouts/auth-layout.tsx',
    ]) {
        const source = read(path);
        assert.match(source, /<AppLogoIcon/);
        assert.doesNotMatch(source, /\/images\/avatar\.png|<Globe/);
    }
});
