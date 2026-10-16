import assert from 'node:assert/strict';
import test from 'node:test';
import { getPublicationStatus } from '../resources/js/lib/publication.ts';

const now = Date.parse('2026-10-16T09:00:00Z');
const future = new Date('2026-10-18T18:30:00.000Z');

test('publishing with a future date is scheduled', () => {
    assert.equal(getPublicationStatus('published', future, now), 'scheduled');
});

test('empty, past and current publication times publish immediately', () => {
    for (const date of [null, undefined, new Date(now - 1), new Date(now)]) {
        assert.equal(getPublicationStatus('published', date, now), 'published');
    }
});

test('a future date does not publish drafts, archived entries or change other content states', () => {
    for (const status of ['draft', 'archived', 'active', undefined]) {
        assert.equal(getPublicationStatus(status, future, now), status);
    }
});
