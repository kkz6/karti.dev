import assert from 'node:assert/strict';
import test from 'node:test';
import { isRouteActive } from '../resources/js/lib/navigation-active.ts';

test('SEO highlights exactly the selected report, with absolute URLs and filters', () => {
    const links = ['https://karti.dev.test/admin/seo', 'https://karti.dev.test/admin/seo/google'];
    for (const [index, name] of ['admin.seo.index', 'admin.seo.google'].entries()) {
        const active = links.map((href) => isRouteActive(name, href));
        assert.equal(active[index], true);
        assert.equal(active[1 - index], false);
        assert.equal(active.some(Boolean), true, 'the SEO parent should be active');
    }
    assert.equal(isRouteActive('admin.seo.google', '/admin/seo/google/?period=7d'), true);
    assert.equal(isRouteActive('admin.seo.content', '/admin/seo'), true);
    assert.equal(isRouteActive('admin.seo.page', '/admin/seo'), true);
    assert.equal(isRouteActive('admin.seo.content', '/admin/seo/google'), false);
    assert.equal(isRouteActive('admin.tools.index', links[0]), false);
    assert.equal(isRouteActive(null, links[0]), false);
});

test('existing section links remain selected on edit pages without matching neighbouring routes', () => {
    const sections = {
        '/admin/blog': 'admin.blog',
        '/admin/blog/categories': 'admin.categories',
        '/admin/blog/tags': 'admin.tags',
        '/admin/photography': 'admin.photography',
        '/admin/projects': 'admin.projects',
        '/admin/speaking': 'admin.speaking',
        '/admin/tools': 'admin.tools',
        '/admin/newsletter': 'admin.newsletter',
        '/admin/settings': 'admin.settings',
    };
    for (const [href, route] of Object.entries(sections)) {
        assert.equal(isRouteActive(`${route}.edit`, href), true);
        assert.equal(isRouteActive(`${route}Other.index`, href), false);
    }
    assert.equal(isRouteActive('admin.tags.edit', '/admin/blog'), false);
    assert.equal(isRouteActive('media-manager', '/admin/media-manager'), true);
    assert.equal(isRouteActive('dashboard', '/dashboard'), true);
});

test('site, media and email settings highlight only their own sidebar link', () => {
    const links = [
        'https://karti.dev.test/admin/settings',
        'https://karti.dev.test/admin/settings/media',
        'https://karti.dev.test/admin/settings/email',
    ];
    assert.deepEqual(
        links.map((href) => isRouteActive('admin.settings.edit', href)),
        [true, false, false],
    );
    assert.deepEqual(
        links.map((href) => isRouteActive('admin.settings.media.edit', href)),
        [false, true, false],
    );
    assert.deepEqual(
        links.map((href) => isRouteActive('admin.settings.email.edit', href)),
        [false, false, true],
    );
    assert.equal(isRouteActive('admin.settings.media.edit', '/admin/settings/media/?tab=defaults'), true);
});
