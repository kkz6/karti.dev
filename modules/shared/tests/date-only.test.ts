import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDateOnly, parseDateOnly } from '../resources/js/lib/date-only.ts';

test('date-only values round-trip without timezone conversion', () => {
    for (const value of ['2026-09-16', '2024-02-29', '2026-01-01', '2026-12-31']) {
        const parsed = parseDateOnly(value)!;
        assert.equal(parsed.getHours(), 0);
        assert.equal(formatDateOnly(parsed), value);
    }
    assert.equal(formatDateOnly(new Date(2026, 8, 16, 23, 59)), '2026-09-16');
});

test('empty and invalid dates do not create an invalid calendar selection', () => {
    for (const value of [undefined, null, '', 'bad', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-10', '2026-01-00']) {
        assert.equal(parseDateOnly(value), undefined);
    }
    assert.equal(formatDateOnly(undefined), '');
    assert.equal(formatDateOnly(new Date('invalid')), '');
});
