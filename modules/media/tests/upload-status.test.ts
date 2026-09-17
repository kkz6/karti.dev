import assert from 'node:assert/strict';
import test from 'node:test';
import { uploadPresentation } from '../resources/js/utils/upload-status.ts';

const file = { id: 'test-upload', name: 'photo.png', progress: 100 };

test('100 percent transferred is saving, not success until the server confirms', () => {
    const state = uploadPresentation({ ...file, status: 'uploading' });
    assert.equal(state.completed, false);
    assert.equal(state.label, 'Saving…');
    assert.equal(uploadPresentation({ ...file, progress: 0, status: 'queued' }).label, 'Queued');
    for (const status of ['complete', 'completed'] as const) {
        assert.equal(uploadPresentation({ ...file, status }).label, 'Uploaded');
    }
});

test('duplicate files get an actionable explanation without repeating the filename', () => {
    const state = uploadPresentation({ ...file, status: 'error', error: "A file named 'photo.png' already exists in this folder." });
    assert.equal(state.label, 'Not uploaded');
    assert.match(state.message!, /Rename your file or choose the existing asset/);
    assert.doesNotMatch(state.message!, /photo.png/);
});

test('other server errors are preserved and missing error messages have a fallback', () => {
    assert.equal(uploadPresentation({ ...file, status: 'error', unconfirmed: true }).label, 'Check destination');
    assert.equal(uploadPresentation({ ...file, status: 'error', error: 'Maximum file size is 25 MB.' }).message, 'Maximum file size is 25 MB.');
    assert.match(uploadPresentation({ ...file, status: 'error' }).message!, /Try uploading this file again/);
});

test('progress is always finite and within the accessible progress bar range', () => {
    for (const [progress, expected] of [
        [-5, 0],
        [170, 100],
        [NaN, 0],
        [46, 46],
    ]) {
        assert.equal(uploadPresentation({ ...file, status: 'uploading', progress }).progress, expected);
    }
});
