import type { InvoiceFormData } from '../invoice-types';

const scale = 10000n;
const maxMinor = 100000000000000000n;
const decimal = (value: string): bigint | null => {
    if (!/^(?:0|[1-9]\d{0,8})(?:\.\d{0,4})?$/.test(value)) return null;
    const [whole, fraction = ''] = value.split('.');
    return BigInt(whole) * scale + BigInt(fraction.padEnd(4, '0'));
};
const rounded = (numerator: bigint, denominator: bigint) => (numerator + denominator / 2n) / denominator;
const money = (minor: bigint, precision: number) => {
    const digits = minor.toString().padStart(precision + 1, '0');
    return precision ? `${digits.slice(0, -precision)}.${digits.slice(-precision)}` : digits;
};

/** Immediate display only; saving and issuance still use the authoritative server calculator.
 * Integer arithmetic mirrors its half-up rounding and stable discount allocation.
 * Customer details and unfinished descriptions do not prevent editing prices.
 */
export function lineAmounts(data: Pick<InvoiceFormData, 'items' | 'discount_mode' | 'discount_value'>, precision: number): Record<string, string> {
    if (!Number.isInteger(precision) || precision < 0 || precision > 4) return {};
    const unit = 10n ** BigInt(precision);
    const gross = data.items.map((line) => {
        const quantity = decimal(line.quantity);
        const rate = decimal(line.rate);
        return quantity !== null && quantity > 0n && rate !== null ? rounded(quantity * rate * unit, scale * scale) : null;
    });
    const subtotal = gross.reduce<bigint>((sum, amount) => sum + (amount ?? 0n), 0n);
    const value = decimal(data.discount_value);
    if (data.discount_mode !== 'none' && value === null) return {};
    if (data.discount_mode === 'percent' && value! > 100n * scale) return {};
    if (data.discount_mode === 'fixed' && (value! * unit) % scale !== 0n) return {};
    const discount =
        data.discount_mode === 'percent' ? rounded(subtotal * value!, 100n * scale) : data.discount_mode === 'fixed' ? (value! * unit) / scale : 0n;
    if (discount > subtotal || subtotal > maxMinor) return {};
    const shares = gross.map((amount) => (subtotal ? (discount * (amount ?? 0n)) / subtotal : 0n));
    let remaining = discount - shares.reduce((sum, share) => sum + share, 0n);
    const order = gross.map((amount, index) => ({
        index,
        remainder: subtotal ? (discount * (amount ?? 0n)) % subtotal : 0n,
        key: data.items[index].key,
    }));
    order.sort((a, b) => (a.remainder === b.remainder ? (a.key < b.key ? -1 : a.key > b.key ? 1 : 0) : a.remainder > b.remainder ? -1 : 1));
    for (const { index } of order) {
        if (remaining === 0n) break;
        shares[index]++;
        remaining--;
    }
    const amounts: Record<string, string> = {};
    data.items.forEach((line, index) => {
        if (gross[index] === null) return;
        const net = gross[index]! - shares[index];
        let total = net;
        for (const tax of line.taxes) {
            const percentage = decimal(tax.percentage);
            if (percentage === null || percentage > 100n * scale) return;
            total += rounded(net * percentage, 100n * scale);
        }
        if (total <= maxMinor) amounts[line.key] = money(total, precision);
    });
    return amounts;
}
