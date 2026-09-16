import assert from 'node:assert/strict';
import test from 'node:test';
import { setEditorTime } from '../resources/js/lib/editor-time.ts';

test('12 AM and 12 PM map to midnight and noon', () => {
    const morning = new Date(2025, 8, 26, 6, 15);
    const midnight = setEditorTime(morning, 'hour', '12');
    assert.equal(midnight.getHours(), 0);
    assert.equal(setEditorTime(midnight, 'period', 'PM').getHours(), 12);
    assert.equal(setEditorTime(new Date(2025, 8, 26, 18), 'hour', '12').getHours(), 12);
    assert.equal(setEditorTime(new Date(2025, 8, 26, 12), 'period', 'AM').getHours(), 0);
});

test('time changes preserve the local calendar date and do not mutate the original', () => {
    const original = new Date(2025, 8, 26, 18, 7, 34, 500);
    const changed = setEditorTime(original, 'minute', '59');
    assert.equal(changed.getFullYear(), 2025);
    assert.equal(changed.getMonth(), 8);
    assert.equal(changed.getDate(), 26);
    assert.equal(changed.getHours(), 18);
    assert.equal(changed.getMinutes(), 59);
    assert.equal(changed.getSeconds(), 0);
    assert.equal(changed.getMilliseconds(), 0);
    assert.equal(original.getMinutes(), 7);
    assert.equal(original.getSeconds(), 34);
    assert.equal(setEditorTime(original, 'hour', '01').getHours(), 13);
    assert.equal(setEditorTime(original, 'period', 'AM').getHours(), 6);
});
