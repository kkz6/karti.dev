import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const imageButton = readFileSync(
    new URL('../resources/js/components/tiptap/tiptap-ui/media-image-button/media-image-button.tsx', import.meta.url),
    'utf8',
);
const articleLayout = readFileSync(new URL('../../frontend/resources/js/components/ArticleLayout.tsx', import.meta.url), 'utf8');

test('article image picker follows the environment media disk', () => {
    assert.match(imageButton, /usePage<SharedData>/);
    assert.match(imageButton, /selectedContainer=\{mediaLibrary\.defaultDisk\}/);
    assert.doesNotMatch(imageButton, /selectedContainer="public"/);
});

test('article layout renders the responsive featured image and links the original', () => {
    assert.match(articleLayout, /src=\{article\.image\.src\}/);
    assert.match(articleLayout, /href=\{article\.image\.fullSrc\}/);
    assert.match(articleLayout, /alt=\{article\.image\.alt\}/);
});
