import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/components/ui/table';
import type { InvoiceData } from '../invoice-types';

export type InvoiceActivity = { id: number; event: string; description: string; actor: string; at: string };

export function InvoiceHistory({ activities, embedded = false }: { activities: InvoiceActivity[]; embedded?: boolean }) {
    const content = activities.length ? (
        <ol className="divide-y">
            {activities.map((entry) => (
                <li key={entry.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm break-words">{entry.description}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                        {entry.actor} · <time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time>
                    </p>
                </li>
            ))}
        </ol>
    ) : (
        <p className="text-muted-foreground text-sm">Activity will appear when this invoice is updated or issued.</p>
    );
    return embedded ? (
        <section className="space-y-4">
            <h2 className="text-[0.9375rem] font-semibold">Activity</h2>
            {content}
        </section>
    ) : (
        <Card>
            <CardHeader>
                <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>{content}</CardContent>
        </Card>
    );
}

export function InvoiceDocument({ invoice }: { invoice: InvoiceData }) {
    const parties = [
        { title: 'Issued by', data: invoice.seller_snapshot as Record<string, unknown>, prefix: '' },
        { title: 'Bill to', data: invoice.customer_snapshot as Record<string, unknown>, prefix: 'billing_' },
    ];
    return (
        <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
                {parties.map(({ title, data, prefix }) => (
                    <Card key={title}>
                        <CardHeader>
                            <CardTitle>{title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            {title === 'Issued by' && invoice.logo && (
                                <img src={invoice.logo} alt="Company logo" className="mb-3 max-h-20 max-w-52 rounded bg-white object-contain p-2" />
                            )}
                            <p className="font-medium break-words">{String(data.legal_name || data.display_name || 'Name not configured')}</p>
                            <address className="text-muted-foreground not-italic">
                                {['address', 'address_line_2', 'city', 'state', 'postal_code', 'country']
                                    .map((key) => data[prefix + key])
                                    .filter(Boolean)
                                    .map((value, i) => (
                                        <p className="break-words" key={i}>
                                            {String(value)}
                                        </p>
                                    ))}
                            </address>
                            {data.tax_identifier ? <p>Tax identifier: {String(data.tax_identifier)}</p> : null}
                            {data.email ? <p className="break-all">{String(data.email)}</p> : null}
                        </CardContent>
                    </Card>
                ))}
            </div>
            <dl className="flex flex-wrap gap-6 text-sm">
                <div>
                    <dt className="text-muted-foreground">Invoice date</dt>
                    <dd>{invoice.invoice_date}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Due date</dt>
                    <dd>{invoice.due_date || 'Not set'}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Currency</dt>
                    <dd>{invoice.currency}</dd>
                </div>
            </dl>
            <Card>
                <CardHeader>
                    <CardTitle>Invoice lines</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right">Unit price</TableHead>
                                <TableHead className="text-right">Line total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.items.map((item) => (
                                <TableRow key={item.key}>
                                    <TableCell className="max-w-md min-w-48 whitespace-normal">
                                        <p className="font-medium break-words">{item.description}</p>
                                        {item.additional_description && (
                                            <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">{item.additional_description}</p>
                                        )}
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            {item.taxes.map((tax) => `${tax.name} ${tax.percentage.replace(/\.?0+$/, '') || '0'}%`).join(', ')}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{item.quantity}</TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell className="text-right tabular-nums">{item.rate}</TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {invoice.totals.lines.find((line) => line.key === item.key)?.total} {invoice.currency}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card className="md:ml-auto md:w-96">
                <CardHeader>
                    <CardTitle>Invoice totals</CardTitle>
                </CardHeader>
                <CardContent>
                    <dl className="space-y-3 text-sm tabular-nums">
                        {[
                            ['Subtotal', invoice.totals.subtotal],
                            ['Discount', invoice.totals.discount],
                            ...invoice.totals.tax_groups.map((tax) => [`${tax.name} (${tax.percentage.replace(/\.?0+$/, '') || '0'}%)`, tax.amount]),
                            ['Total', invoice.totals.total],
                        ].map(([label, value], index) => (
                            <div key={index} className={`flex justify-between gap-4 ${label === 'Total' ? 'border-t pt-3 font-semibold' : ''}`}>
                                <dt className="min-w-0 break-words">{label}</dt>
                                <dd className="shrink-0">
                                    {label === 'Discount' ? '−' : ''}
                                    {value} {invoice.currency}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </CardContent>
            </Card>
            <div className="grid gap-5 md:grid-cols-2">
                {(['customer_note', 'terms', 'payment_instructions', 'internal_note'] as const).map((field) =>
                    invoice[field] ? (
                        <Card key={field}>
                            <CardHeader>
                                <CardTitle>
                                    {
                                        {
                                            customer_note: 'Customer note',
                                            terms: 'Terms',
                                            payment_instructions: 'Payment instructions',
                                            internal_note: 'Internal note',
                                        }[field]
                                    }
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm break-words whitespace-pre-wrap">{invoice[field]}</p>
                            </CardContent>
                        </Card>
                    ) : null,
                )}
            </div>
        </div>
    );
}
