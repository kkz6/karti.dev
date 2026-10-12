import { getCountryCallingCode, isSupportedCountry, parsePhoneNumber, type Country } from 'react-phone-number-input/max';

function phoneText(value: string): string {
    return value
        .normalize('NFKC')
        .trim()
        .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, '')
        .replace(/[\u2010-\u2015\u2212]/g, '-')
        .replace(/^tel:/i, '');
}

/** Recognize a complete clipboard number before the selected country's prefix is applied. */
export function normalizePhonePaste(value: string, country?: Country): string | undefined {
    const text = phoneText(value);
    if (!/^\+?[\d\s().-]+$/.test(text)) return undefined;
    const digits = text.replace(/\D/g, '');
    if (text.startsWith('+') || digits.startsWith('00') || (['US', 'CA'].includes(country ?? '') && digits.startsWith('011'))) {
        const international = text.startsWith('+') ? `+${digits}` : `+${digits.slice(digits.startsWith('00') ? 2 : 3)}`;
        const parsed = parsePhoneNumber(international);
        return parsed?.isPossible() ? parsed.number : undefined;
    }
    // A valid local number wins over a guessed bare calling code. For example,
    // US area code 202 must not be mistaken for Egypt's +20.
    const national = country ? parsePhoneNumber(text, country) : undefined;
    if (national?.isValid()) return national.number;
    const international = parsePhoneNumber(`+${digits}`);
    return international?.isValid() ? international.number : undefined;
}

/** Free-text and extensions stay editable; incomplete numeric values keep the formatter. */
export function isLegacyPhoneValue(value: string): boolean {
    const text = phoneText(value);
    return text !== '' && text !== '+' && (!/^\+?[\d\s().-]+$/.test(text) || Boolean(parsePhoneNumber(text)?.ext));
}

/** Normalize for display only. Loading a form never rewrites its stored value. */
export function phoneInputValue(value: string, country?: Country): string | undefined {
    if (!value) return undefined;
    const text = phoneText(value);
    const complete = normalizePhonePaste(text, country);
    if (complete) return complete;
    const parsed = parsePhoneNumber(text, country);
    if (parsed && !parsed.ext) return parsed.number;
    const digits = text.replace(/\D/g, '');
    return text.startsWith('+') ? `+${digits}` : digits ? `+${country ? getCountryCallingCode(country) : ''}${digits}` : undefined;
}

/** Read-only phone labels use the same country metadata without changing stored values. */
export function formatPhoneDisplay(value?: string | null, defaultCountry?: string | null): string {
    if (!value) return '—';
    const code = defaultCountry?.toUpperCase();
    const country = code && isSupportedCountry(code) ? (code as Country) : undefined;
    const normalized = normalizePhonePaste(value, country);
    const parsed = parsePhoneNumber(normalized ?? value, country);
    return parsed && (normalized || parsed.ext) ? parsed.formatInternational() : value;
}
