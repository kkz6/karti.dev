import { Link } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/components/ui/table';
import { statusTone } from '@shared/lib/status-colors';
import { FileText } from 'lucide-react';
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
                    <CustomerInvoiceTable invoices={financials.invoices} />
                </CardContent>
            </Card>
            {financials.payments !== null && <PaymentHistory payments={financials.payments} />}
        </div>
    );
}

export function CustomerInvoiceTable({ invoices }: { invoices: Financials['invoices'] }) {
    if (invoices.length === 0) {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-5">
                <FileText className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <div>
                    <p className="text-sm font-medium">No invoices yet</p>
                    <p className="text-muted-foreground mt-1 text-sm">Invoices issued to this customer will appear here.</p>
                </div>
            </div>
        );
    }
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Due date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {invoices.map((invoice) => {
                    const state = invoice.status === 'issued' ? invoice.settlement.state : invoice.status;
                    return (
                        <TableRow key={invoice.id}>
                            <TableCell>
                                <Link className="font-medium hover:underline" href={route('admin.invoices.show', invoice.id)}>
                                    {invoice.number}
                                </Link>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1.5">
                                    <Badge variant={statusTone(state)}>{state.charAt(0).toUpperCase() + state.slice(1)}</Badge>
                                    {invoice.settlement.overdue && <Badge variant="destructive">Overdue</Badge>}
                                </div>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap tabular-nums">
                                {invoice.total} <span className="text-muted-foreground text-xs">{invoice.currency}</span>
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {invoice.status === 'issued' ? invoice.settlement.balance : '—'}
                            </TableCell>
                            <TableCell className="tabular-nums">{invoice.due_date ?? '—'}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}
