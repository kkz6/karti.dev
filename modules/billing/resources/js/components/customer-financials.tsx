import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/components/ui/table';
import type { CustomerFinancials as Financials } from '../payment-types';
import { BillingSummary } from './billing-summary';
import { PaymentHistory } from './invoice-payments';
export function CustomerFinancials({ financials }: { financials: Financials }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Balances by currency</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Issued invoices and active payments. Drafts and cancelled invoices are excluded. Each currency is kept separate.
                    </p>
                    {financials.totals.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Balances will appear after the first invoice is issued.</p>
                    ) : (
                        <div className="space-y-5">
                            {financials.totals.map((total) => (
                                <section key={total.currency} className="space-y-3">
                                    <h3 className="text-sm font-semibold">{total.currency} account</h3>
                                    <BillingSummary
                                        items={[
                                            { label: 'Total invoiced', value: total.invoiced },
                                            { label: 'Payments received', value: total.paid },
                                            { label: 'Invoice balance', value: total.balance },
                                            { label: 'Net account balance', value: total.net_balance, emphasis: true },
                                        ]}
                                    />
                                    <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                        <div>
                                            <dt className="text-muted-foreground">Credit applied</dt>
                                            <dd className="font-medium tabular-nums">{total.credited}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Available credit</dt>
                                            <dd className="font-medium tabular-nums">{total.available_credit}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Overdue</dt>
                                            <dd className="font-medium tabular-nums">{total.overdue}</dd>
                                        </div>
                                    </dl>
                                </section>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Invoice history</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Balance</TableHead>
                                <TableHead>Due date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {financials.invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell>
                                        <Link className="underline underline-offset-4" href={route('admin.invoices.show', invoice.id)}>
                                            {invoice.number}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        {invoice.status === 'issued' ? invoice.settlement.state : invoice.status}
                                        {invoice.settlement.overdue && ' · overdue'}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {invoice.total} {invoice.currency}
                                    </TableCell>
                                    <TableCell>{invoice.status === 'issued' ? invoice.settlement.balance : '—'}</TableCell>
                                    <TableCell>{invoice.due_date ?? '—'}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {financials.payments !== null && <PaymentHistory payments={financials.payments} />}
        </div>
    );
}
