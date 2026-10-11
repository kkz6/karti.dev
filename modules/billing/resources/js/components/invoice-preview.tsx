import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/components/ui/table';
import { cn } from '@shared/lib/utils';
import type { InvoiceData } from '../invoice-types';
import type { Settlement } from '../payment-types';
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
    return (
        <article className={cn('bg-card space-y-6 text-sm', !embedded && 'p-5 sm:p-7', className)}>
            <div className="grid gap-5 sm:grid-cols-2">
                <div>
                    <p className="font-semibold">{String(company.legal_name || company.display_name || 'Company details not configured')}</p>
                    <div className="text-muted-foreground mt-1 text-xs leading-5">
                        {['address', 'address_line_2', 'city', 'state', 'postal_code', 'country'].map((field) =>
                            company[field] ? (
                                <p key={field} className="break-words">
                                    {String(company[field])}
                                </p>
                            ) : null,
                        )}
                    </div>
                </div>
                <div className="sm:text-right">
                    <p className="text-muted-foreground text-xs">Bill to</p>
                    <p className="mt-1 font-semibold break-words">{String(customer.legal_name || customer.display_name || 'Customer')}</p>
                    <div className="text-muted-foreground mt-1 text-xs leading-5">
                        {['billing_address', 'billing_address_line_2', 'billing_city', 'billing_state', 'billing_postal_code', 'billing_country'].map(
                            (field) => (customer[field] ? <p key={field}>{String(customer[field])}</p> : null),
                        )}
                    </div>
                </div>
            </div>
            {showMetadata && (
                <dl className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                    <div>
                        <dt className="text-muted-foreground">Invoice date</dt>
                        <dd className="mt-1">{invoice.invoice_date}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Due date</dt>
                        <dd className="mt-1">{invoice.due_date || '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-muted-foreground">Currency</dt>
                        <dd className="mt-1">{invoice.currency}</dd>
                    </div>
                </dl>
            )}
            <Table>
                <TableHeader className="bg-primary [&_th]:text-primary-foreground">
                    <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {invoice.items.map((item) => (
                        <TableRow key={item.key}>
                            <TableCell className="max-w-64 whitespace-normal">
                                <p className="font-medium">{item.description}</p>
                                {item.additional_description && (
                                    <p className="text-muted-foreground mt-1 text-xs leading-5 whitespace-pre-line">{item.additional_description}</p>
                                )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{displayDecimal(item.quantity)}</TableCell>
                            <TableCell className="text-right tabular-nums">{displayRate(item.rate, invoice.totals.precision)}</TableCell>
                            <TableCell className="text-right tabular-nums">
                                {invoice.totals.lines.find((line) => line.key === item.key)?.gross ?? '—'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <dl className="ml-auto max-w-xs space-y-2.5 tabular-nums">
                {[
                    ['Subtotal', invoice.totals.subtotal],
                    ...(!isZero(invoice.totals.discount) ? [['Discount', invoice.totals.discount]] : []),
                    ...invoice.totals.tax_groups.map((tax) => [`${tax.name} (${tax.percentage}%)`, tax.amount]),
                    ['Total', invoice.totals.total],
                    ...(settlement
                        ? [
                              ...(!isZero(settlement.paid) ? [['Paid', settlement.paid]] : []),
                              ...(!isZero(settlement.credited) ? [['Credit applied', settlement.credited]] : []),
                              [invoice.status === 'cancelled' ? 'Cancelled amount' : 'Amount due', settlement.balance],
                          ]
                        : []),
                ].map(([label, value], index) => (
                    <div
                        key={index}
                        className={`flex justify-between gap-4 ${label === 'Amount due' || label === 'Cancelled amount' ? 'rounded-md border p-3 font-semibold ' + (invoice.status === 'cancelled' ? 'border-red-500/25 bg-red-500/5 text-red-700 dark:text-red-300' : isZero(value) ? 'border-emerald-500/25 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' : 'border-amber-500/25 bg-amber-500/5 text-amber-800 dark:text-amber-300') : label === 'Total' ? 'text-foreground border-t pt-2.5 font-semibold' : ''}`}
                    >
                        <dt
                            className={
                                label === 'Amount due' || label === 'Cancelled amount' || label === 'Total' ? 'text-current' : 'text-muted-foreground'
                            }
                        >
                            {label}
                        </dt>
                        <dd>
                            {value} {invoice.currency}
                        </dd>
                    </div>
                ))}
            </dl>
            {invoice.customer_note && (
                <section className="border-t pt-4">
                    <h3 className="text-xs font-medium">Note</h3>
                    <p className="text-muted-foreground mt-2 text-xs leading-5 whitespace-pre-line">{invoice.customer_note}</p>
                </section>
            )}
            {invoice.payment_instructions && (
                <section className="border-t pt-4">
                    <h3 className="text-xs font-medium">Payment instructions</h3>
                    <p className="text-muted-foreground mt-2 text-xs leading-5 whitespace-pre-line">{invoice.payment_instructions}</p>
                </section>
            )}
            {invoice.terms && (
                <section className="border-t pt-4">
                    <h3 className="text-xs font-medium">Terms</h3>
                    <p className="text-muted-foreground mt-2 text-xs leading-5 whitespace-pre-line">{invoice.terms}</p>
                </section>
            )}
        </article>
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
