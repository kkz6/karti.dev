import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePhoneNumber } from 'react-phone-number-input/max';
import { isLegacyPhoneValue, normalizePhonePaste, phoneInputValue } from '../resources/js/lib/phone-number.ts';

test('international clipboard numbers override a different selected country', () => {
    for (const value of [
        '+91 98809 52222',
        '919880952222',
        '0091 98809 52222',
        'tel:+91-98809-52222',
        '\u200e+91\u00a098809\u00a052222',
        '＋９１ ９８８０９ ５２２２２',
    ]) {
        assert.equal(normalizePhonePaste(value, 'IE'), '+919880952222');
        assert.equal(parsePhoneNumber(normalizePhonePaste(value, 'IE')!)?.country, 'IN');
    }
    assert.equal(normalizePhonePaste('+1 (416) 555-0123', 'IE'), '+14165550123');
    assert.equal(parsePhoneNumber(normalizePhonePaste('+1 (416) 555-0123', 'IE')!)?.country, 'CA');
});

test('Irish numbers recognize country prefixes and format in national groups', () => {
    for (const value of ['+353 87 123 4567', '00353 87 123 4567', '353871234567', '+353 (0)87 123 4567']) {
        const normalized = normalizePhonePaste(value, 'IN');
        assert.equal(normalized, '+353871234567');
        assert.equal(parsePhoneNumber(normalized!)?.formatNational(), '087 123 4567');
    }
    assert.equal(normalizePhonePaste('087 123 4567', 'IE'), '+353871234567');
});

test('local numbers win over ambiguous bare country codes', () => {
    assert.equal(normalizePhonePaste('202 555 0123', 'US'), '+12025550123');
    assert.equal(normalizePhonePaste('98809 52222', 'IN'), '+919880952222');
    assert.equal(normalizePhonePaste('011 353 87 123 4567', 'US'), '+353871234567');
    assert.equal(normalizePhonePaste('011 2345 6789', 'IN'), '+911123456789');
});

test('incomplete numbers stay in the formatted input while legacy text and extensions are preserved', () => {
    for (const value of ['', '9', '98', '087', '+', '+3538', '0091', '(202) 555-0123']) assert.equal(isLegacyPhoneValue(value), false);
    for (const value of ['Call reception', '+1 202 555 0123 ext 42', '2025550123 x42']) assert.equal(isLegacyPhoneValue(value), true);
    assert.equal(normalizePhonePaste('123', 'IE'), undefined);
    assert.equal(normalizePhonePaste('Call +91 9880952222', 'IE'), undefined);
    assert.equal(normalizePhonePaste('+12025550123 ext 42', 'IE'), undefined);
    assert.equal(phoneInputValue('12', 'IN'), '+9112');
    assert.equal(phoneInputValue('+91 98809 52222', 'IE'), '+919880952222');
    assert.equal(phoneInputValue('', 'IE'), undefined);
});

test('read-only phone labels use international groups while preserving legacy text and extensions', async () => {
    const { formatPhoneDisplay } = await import('../resources/js/lib/phone-number.ts');
    assert.equal(formatPhoneDisplay('+353858818558', 'IE'), '+353 85 881 8558');
    assert.equal(formatPhoneDisplay('0871234567', 'IE'), '+353 87 123 4567');
    assert.equal(formatPhoneDisplay('+12025550123'), '+1 202 555 0123');
    assert.equal(formatPhoneDisplay('Call reception'), 'Call reception');
    assert.equal(formatPhoneDisplay('+12025550123 ext 42'), '+1 202 555 0123 ext. 42');
    assert.equal(formatPhoneDisplay(null), '—');
});
