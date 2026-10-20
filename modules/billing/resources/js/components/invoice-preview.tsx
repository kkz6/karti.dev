import { cn } from '@shared/lib/utils';
import type { ReactNode } from 'react';
import type { InvoiceData } from '../invoice-types';
import type { Settlement } from '../payment-types';

const sellerFields = ['address', 'address_line_2', 'city', 'state', 'postal_code', 'country'];
const customerFields = ['billing_address', 'billing_address_line_2', 'billing_city', 'billing_state', 'billing_postal_code', 'billing_country'];

/** Customer-facing invoice document. Mirrors the PDF layout so staff review what the customer receives. */
export function InvoicePreview({
    invoice,
    settlement,
    className,
    embedded = false,
    showMetadata = true,
}: {
    invoice: InvoiceData;
    settlement?: Settlement;
    className?: string;
    embedded?: boolean;
    showMetadata?: boolean;
}) {
    const company = invoice.seller_snapshot as Record<string, unknown>,
        customer = invoice.customer_snapshot as Record<string, unknown>;
    const cancelled = invoice.status === 'cancelled';
    const hasTax = invoice.totals.tax_groups.length > 0;
    const money = (value: string) => (
        <>
            {value} <span className="text-muted-foreground text-[0.6875rem] font-normal">{invoice.currency}</span>
        </>
    );
    const due = settlement ? (cancelled ? 'Cancelled amount' : 'Amount due') : null;
    const dueTone = cancelled
        ? 'border-red-500/25 bg-red-500/5 text-red-700 dark:text-red-300'
        : settlement && isZero(settlement.balance)
          ? 'border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300'
          : 'border-amber-500/25 bg-amber-500/5 text-amber-800 dark:text-amber-300';
    const notes = [
        ['Note', invoice.customer_note],
        ['Payment instructions', invoice.payment_instructions],
        ['Terms', invoice.terms],
    ].filter((entry): entry is [string, string] => !!entry[1]);

    return (
        <article className={cn('bg-card text-sm', !embedded && 'p-5 sm:p-8', className)}>
            <header className="flex flex-wrap items-start justify-between gap-6">
                <div className="min-w-0">
                    {invoice.logo && <img src={invoice.logo} alt="Company logo" className="mb-4 max-h-20 max-w-52 bg-white object-contain" />}
                    <p className="text-base font-semibold break-words">
                        {String(company.legal_name || company.display_name || 'Company details not configured')}
                    </p>
                    <Lines source={company} fields={sellerFields} />
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground text-[0.6875rem] font-medium tracking-[0.14em] uppercase">
                        {invoice.status === 'draft' ? 'Draft invoice' : 'Invoice'}
                    </p>
                    <p className={cn('mt-1 text-lg font-semibold tracking-tight tabular-nums')}>
                        {invoice.formatted_number ?? `Draft #${invoice.id}`}
                    </p>
                </div>
            </header>

            <div className={cn('mt-8 grid gap-6 border-y py-5', showMetadata && 'sm:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]')}>
                <div className="min-w-0">
                    <Label>Bill to</Label>
                    <p className="mt-1.5 font-medium break-words">{String(customer.legal_name || customer.display_name || 'Customer')}</p>
                    <Lines source={customer} fields={customerFields} />
                </div>
                {showMetadata && (
                    <>
                        <Meta label="Invoice date" value={invoice.invoice_date} />
                        <Meta label="Due date" value={invoice.due_date || '—'} />
                        <Meta label="Currency" value={invoice.currency} />
                    </>
                )}
            </div>

            <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[32rem] text-sm">
                    <thead>
                        <tr className="text-muted-foreground border-b text-left text-[0.6875rem] font-medium tracking-wider uppercase">
                            <th className="w-8 pb-2.5 font-medium">#</th>
                            <th className="pb-2.5 font-medium">Item</th>
                            <th className="pb-2.5 text-right font-medium">Qty</th>
                            <th className="pb-2.5 text-right font-medium">Rate</th>
                            {hasTax && <th className="pb-2.5 text-right font-medium">Tax</th>}
                            <th className="pb-2.5 text-right font-medium">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {invoice.items.map((item, index) => (
                            <tr key={item.key} className="align-top">
                                <td className="text-muted-foreground py-3.5 text-xs tabular-nums">{index + 1}</td>
                                <td className="py-3.5 pr-4">
                                    <p className="font-medium break-words">{item.description}</p>
                                    {item.additional_description && (
                                        <p className="text-muted-foreground mt-1 text-xs leading-5 break-words whitespace-pre-line">
                                            {item.additional_description}
                                        </p>
                                    )}
                                </td>
                                <td className="py-3.5 pl-3 text-right whitespace-nowrap tabular-nums">
                                    {displayDecimal(item.quantity)}
                                    {item.unit && item.unit !== 'item' && (
                                        <span className="text-muted-foreground block text-[0.6875rem]">{item.unit}</span>
                                    )}
                                </td>
                                <td className="py-3.5 pl-3 text-right whitespace-nowrap tabular-nums">
                                    {displayRate(item.rate, invoice.totals.precision)}
                                </td>
                                {hasTax && (
                                    <td className="text-muted-foreground py-3.5 pl-3 text-right text-xs whitespace-nowrap tabular-nums">
                                        {item.taxes.length ? item.taxes.map((tax) => `${displayDecimal(tax.percentage)}%`).join(', ') : '—'}
                                    </td>
                                )}
                                <td className="py-3.5 pl-3 text-right font-medium whitespace-nowrap tabular-nums">
                                    {invoice.totals.lines.find((line) => line.key === item.key)?.gross ?? '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-2 flex justify-end border-t pt-5">
                <dl className="w-full max-w-xs space-y-2.5 tabular-nums">
                    <Row label="Subtotal">{money(invoice.totals.subtotal)}</Row>
                    {!isZero(invoice.totals.discount) && <Row label="Discount">− {money(invoice.totals.discount)}</Row>}
                    {invoice.totals.tax_groups.map((tax) => (
                        <Row key={tax.name + tax.percentage} label={`${tax.name} (${displayDecimal(tax.percentage)}%)`}>
                            {money(tax.amount)}
                        </Row>
                    ))}
                    <div className="flex items-baseline justify-between gap-4 border-t pt-3">
                        <dt className="font-semibold">Total</dt>
                        <dd className="text-base font-semibold">{money(invoice.totals.total)}</dd>
                    </div>
                    {settlement && !isZero(settlement.paid) && <Row label="Paid">− {money(settlement.paid)}</Row>}
                    {settlement && !isZero(settlement.credited) && <Row label="Credit applied">− {money(settlement.credited)}</Row>}
                    {settlement && due && (
                        <div className={cn('flex items-baseline justify-between gap-4 rounded-md border px-3 py-2.5 font-semibold', dueTone)}>
                            <dt>{due}</dt>
                            <dd>
                                {settlement.balance} <span className="text-[0.6875rem] font-normal opacity-75">{invoice.currency}</span>
                            </dd>
                        </div>
                    )}
                </dl>
            </div>

            {notes.length > 0 && (
                <div className={cn('mt-8 grid gap-6 border-t pt-6', notes.length > 1 && 'sm:grid-cols-2')}>
                    {notes.map(([title, text]) => (
                        <section key={title} className="min-w-0">
                            <Label>{title}</Label>
                            <p className="text-muted-foreground mt-1.5 text-xs leading-5 break-words whitespace-pre-line">{text}</p>
                        </section>
                    ))}
                </div>
            )}
        </article>
    );
}

function Label({ children }: { children: string }) {
    return <p className="text-muted-foreground text-[0.6875rem] font-medium tracking-wider uppercase">{children}</p>;
}

function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div className="min-w-0">
            <Label>{label}</Label>
            <p className="mt-1.5 font-medium tabular-nums">{value}</p>
        </div>
    );
}

function Lines({ source, fields }: { source: Record<string, unknown>; fields: string[] }) {
    const lines = fields.map((field) => source[field]).filter(Boolean);
    if (!lines.length) return null;
    return (
        <address className="text-muted-foreground mt-1 text-xs leading-5 not-italic">
            {lines.map((line, i) => (
                <p key={i} className="break-words">
                    {String(line)}
                </p>
            ))}
        </address>
    );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd>{children}</dd>
        </div>
    );
}

function displayDecimal(value: string): string {
    return value.includes('.') ? value.replace(/0+$/, '').replace(/\.$/, '') : value;
}
function displayRate(value: string, precision: number): string {
    const [integer, fraction = ''] = value.split('.');
    const digits = fraction.replace(/0+$/, '').padEnd(precision, '0');
    return integer + (digits ? '.' + digits : '');
}

function isZero(value: string): boolean {
    return /^-?0(?:\.0+)?$/.test(value);
}
