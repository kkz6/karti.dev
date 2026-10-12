import { formatPhoneDisplay } from '@shared/lib/phone-number';

/** Format table labels with the same metadata as phone fields and detail cards. */
export function PhoneCell({ value, country }: { value: unknown; country?: string | null }) {
    return <span className="whitespace-nowrap tabular-nums">{formatPhoneDisplay(typeof value === 'string' ? value : null, country)}</span>;
}
