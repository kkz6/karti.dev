import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDocumentTitle, resolveSeoPreview } from '../resources/js/lib/site-metadata.ts';

const site = { name: 'Field Notes', title: 'Karthick’s notes', description: 'Software and travel.', image: '/share.jpg' };

test('preview uses custom SEO, entry metadata, then site defaults', () => {
    assert.equal(resolveSeoPreview(site, { title: 'Japan' }, {}).title, 'Japan');
    assert.equal(resolveSeoPreview(site, { title: 'Japan' }, { title: 'Visiting Japan' }).title, 'Visiting Japan');
    assert.deepEqual(resolveSeoPreview(site, { title: ' ', description: '' }, {}), {
        title: site.title, description: site.description, image: site.image,
    });
});

test('document titles use saved identity without duplicating a site suffix or changing explicit SEO', () => {
    assert.equal(formatDocumentTitle('Site settings', site.name, false), 'Site settings - Field Notes');
    assert.equal(formatDocumentTitle('Japan', site.name, true), 'Japan');
    assert.equal(formatDocumentTitle('Japan - Field Notes', site.name, false), 'Japan - Field Notes');
});
