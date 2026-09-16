import assert from 'node:assert/strict';
import test from 'node:test';
import { getEditorReadingStats } from '../resources/js/lib/editor-reading-stats.ts';

test('empty editor has zero words and reading time', () => {
    assert.deepEqual(getEditorReadingStats(' \n\t '), { words: 0, readingTime: '0:00' });
});

test('counts words across paragraphs and formats minutes and seconds', () => {
    assert.deepEqual(getEditorReadingStats('Hello world.\n\nAnother paragraph.'), { words: 4, readingTime: '0:02' });
    assert.deepEqual(getEditorReadingStats(Array(200).fill('word').join(' ')), { words: 200, readingTime: '1:00' });
    assert.deepEqual(getEditorReadingStats(Array(201).fill('word').join(' ')), { words: 201, readingTime: '1:01' });
});
