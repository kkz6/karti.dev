import { router, useForm } from '@inertiajs/react';
import { DateField } from '@shared/components/date-field';
import { RowActionButton } from '@shared/components/row-action-button';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/components/ui/table';
import { Textarea } from '@shared/components/ui/textarea';
import { statusTone } from '@shared/lib/status-colors';
import { CreditCard, Undo2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { InvoiceData } from '../invoice-types';
import type { PaymentData, PaymentMethod, Settlement } from '../payment-types';
import { BillingFeedback } from './billing-feedback';
import { BillingSelect, BillingSelectItem } from './billing-select';

export function PaymentHistory({
    payments,
    onReverse,
    embedded = false,
    emptyDescription = 'Payments received for this invoice will appear here.',
}: {
    payments: PaymentData[];
    onReverse?: (payment: PaymentData) => void;
    embedded?: boolean;
    emptyDescription?: string;
}) {
    const hasActions = !!onReverse && payments.some((payment) => payment.canReverse);
    return (
        <Card className={embedded ? 'rounded-none border-0 bg-transparent' : undefined}>
            <CardHeader className={embedded ? 'px-0 pt-0 pb-3' : undefined}>
                <CardTitle>Payment history</CardTitle>
            </CardHeader>
            <CardContent className={embedded ? 'p-0' : undefined}>
                {payments.length === 0 ? (
                    <div className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-5">
                        <CreditCard className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-medium">No payments recorded</p>
                            <p className="text-muted-foreground mt-1 text-sm">{emptyDescription}</p>
                        </div>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Status</TableHead>
                                {hasActions && (
                                    <TableHead className="w-12 text-center">
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="whitespace-nowrap">
                                        #{payment.id}
                                        <p className="text-muted-foreground text-xs whitespace-nowrap">{payment.payment_date}</p>
                                        {payment.invoice_number && <p className="whitespace-nowrap">{payment.invoice_number}</p>}
                                    </TableCell>
                                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                                        {payment.amount} {payment.currency}
                                    </TableCell>
                                    <TableCell className="max-w-sm break-words whitespace-normal">
                                        {payment.method_label}
                                        {payment.reference && <p>Transaction ID / reference: {payment.reference}</p>}
                                        {payment.notes && <p>{payment.notes}</p>}
                                        <p className="text-muted-foreground text-xs">
                                            Recorded by {payment.actor_name} · {payment.created_at}
                                        </p>
                                    </TableCell>
                                    <TableCell className="max-w-sm whitespace-normal">
                                        <Badge variant={payment.reversed_at ? 'warning' : 'success'}>
                                            {payment.reversed_at ? 'Reversed' : 'Active'}
                                        </Badge>
                                        {payment.reversed_at && (
                                            <p className="mt-2 text-xs">
                                                {payment.reversal_reason}
                                                <br />
                                                By {payment.reversed_by_name} · {payment.reversed_at}
                                            </p>
                                        )}
                                    </TableCell>
                                    {hasActions && (
                                        <TableCell className="text-center">
                                            {onReverse && payment.canReverse && (
                                                <RowActionButton
                                                    label={`Reverse payment #${payment.id}`}
                                                    tooltip="Reverse payment"
                                                    destructive
                                                    onClick={() => onReverse(payment)}
                                                >
                                                    <Undo2 className="size-4" />
                                                </RowActionButton>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}

export function InvoicePayments({
    invoice,
    settlement,
    payments,
    canRecord,
    methods,
    today,
    embedded = false,
    customerContext,
    onRecorded,
    recordRequested = false,
    onRecordRequested,
}: {
    invoice: InvoiceData;
    settlement: Settlement;
    payments: PaymentData[] | null;
    canRecord: boolean;
    methods: PaymentMethod[];
    today: string;
    embedded?: boolean;
    customerContext?: number;
    onRecorded?: () => void;
    recordRequested?: boolean;
    onRecordRequested?: () => void;
}) {
    const [recording, setRecording] = useState(false);
    const [reversing, setReversing] = useState<PaymentData | null>(null);
    const form = useForm({
        version: invoice.version,
        request_key: '',
        amount: '',
        currency: invoice.currency,
        payment_date: today,
        method: methods[0]?.value ?? '',
        reference: '',
        notes: '',
        send_receipt: false,
    });
    const reversal = useForm({ version: invoice.version, reason: '' });
    const openRecord = useCallback(() => {
        form.clearErrors();
        form.setData({
            version: invoice.version,
            request_key: crypto.randomUUID(),
            amount: settlement.balance,
            currency: invoice.currency,
            payment_date: today,
            method: methods[0]?.value ?? '',
            reference: '',
            notes: '',
            send_receipt: false,
        });
        setRecording(true);
    }, [form, invoice.version, invoice.currency, settlement.balance, today, methods]);
    useEffect(() => {
        if (!recordRequested) return;
        if (canRecord && settlement.can_receive && methods.length > 0) openRecord();
        onRecordRequested?.();
    }, [recordRequested, canRecord, settlement.can_receive, methods.length, openRecord, onRecordRequested]);
    const errors = (values: Record<string, string>) =>
        Object.values(values).length > 0 && (
            <BillingFeedback kind="error">
                {Object.values(values).map((value, i) => (
                    <p key={i}>{value}</p>
                ))}
                <Button
                    className="mt-2"
                    variant="outline"
                    onClick={() => {
                        setRecording(false);
                        setReversing(null);
                        router.reload();
                    }}
                >
                    Reload invoice
                </Button>
            </BillingFeedback>
        );
    return (
        <div className="space-y-6">
            <Card className={embedded ? 'rounded-none border-0 bg-transparent' : undefined}>
                <CardHeader className={embedded ? 'px-0 pt-0 pb-3' : undefined}>
                    <CardTitle>Payment balance</CardTitle>
                </CardHeader>
                <CardContent className={embedded ? 'space-y-4 p-0' : 'space-y-4'}>
                    <div className="flex flex-wrap items-center gap-3">
                        <Badge variant={statusTone(settlement.state)}>
                            {settlement.state === 'partial'
                                ? 'Partially paid'
                                : settlement.state === 'settled'
                                  ? 'Settled with credit'
                                  : settlement.state === 'paid'
                                    ? 'Paid'
                                    : settlement.state === 'cancelled'
                                      ? 'Cancelled'
                                      : 'Unpaid'}
                        </Badge>
                        {settlement.overdue && <Badge variant="destructive">Overdue</Badge>}
                    </div>
                    <dl className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <dt className="text-muted-foreground text-xs">Total</dt>
                            <dd className="mt-1 text-base font-semibold tabular-nums">
                                {invoice.totals.total} {invoice.currency}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground text-xs">Paid</dt>
                            <dd className="mt-1 text-base font-semibold tabular-nums">
                                {settlement.paid} {invoice.currency}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted-foreground text-xs">
                                {invoice.status === 'cancelled' ? 'Cancelled amount' : 'Remaining balance'}
                            </dt>
                            <dd className="mt-1 text-base font-semibold tabular-nums">
                                {settlement.balance} {invoice.currency}
                            </dd>
                        </div>
                    </dl>
                    {!/^0(?:\.0+)?$/.test(settlement.credited) && (
                        <p className="text-sm">
                            Credit applied: {settlement.credited} {invoice.currency}
                        </p>
                    )}
                    {canRecord &&
                        settlement.can_receive &&
                        (methods.length > 0 ? (
                            <Button variant="success" onClick={openRecord}>
                                Record payment
                            </Button>
                        ) : (
                            <BillingFeedback>Enable a manual payment method in billing settings to record payments.</BillingFeedback>
                        ))}
                </CardContent>
            </Card>
            {payments !== null && (
                <PaymentHistory
                    embedded={embedded}
                    payments={payments}
                    onReverse={(payment) => {
                        reversal.clearErrors();
                        reversal.setData({ version: invoice.version, reason: '' });
                        setReversing(payment);
                    }}
                />
            )}
            <Dialog
                open={recording}
                onOpenChange={(open) => {
                    if (!form.processing) setRecording(open);
                }}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Record payment</DialogTitle>
                        <DialogDescription>
                            Record money already received in {invoice.currency}. The remaining balance is filled in; a smaller amount records a
                            partial payment. No email or SMS is sent.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.post(route('admin.invoices.payments.store', invoice.id), {
                                headers: customerContext ? { 'X-Customer-Context': String(customerContext) } : {},
                                preserveScroll: true,
                                onSuccess: () => {
                                    setRecording(false);
                                    onRecorded?.();
                                },
                            });
                        }}
                    >
                        {errors(form.errors)}
                        <div className="space-y-2">
                            <Label htmlFor="payment-amount">Amount ({invoice.currency})</Label>
                            <Input
                                id="payment-amount"
                                inputMode="decimal"
                                value={form.data.amount}
                                onChange={(e) => form.setData('amount', e.target.value)}
                                required
                                disabled={form.processing}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-date">Payment date</Label>
                            <DateField
                                id="payment-date"
                                label="Payment date"
                                value={form.data.payment_date}
                                onChange={(value) => form.setData('payment_date', value)}
                                disabled={form.processing}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-method">Payment method</Label>
                            <BillingSelect
                                id="payment-method"
                                value={form.data.method}
                                onValueChange={(value) => form.setData('method', value)}
                                disabled={form.processing}
                            >
                                {methods.map((method) => (
                                    <BillingSelectItem key={method.value} value={method.value}>
                                        {method.label}
                                    </BillingSelectItem>
                                ))}
                            </BillingSelect>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-reference">Transaction ID / reference</Label>
                            <Input
                                id="payment-reference"
                                value={form.data.reference}
                                onChange={(e) => form.setData('reference', e.target.value)}
                                maxLength={255}
                                placeholder="Bank, Wise, or payment provider reference"
                                disabled={form.processing}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-notes">Notes</Label>
                            <Textarea
                                id="payment-notes"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                maxLength={2000}
                                disabled={form.processing}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" disabled={form.processing} onClick={() => setRecording(false)}>
                                Close
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Recording…' : 'Save payment'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog
                open={reversing !== null}
                onOpenChange={(open) => {
                    if (!reversal.processing && !open) setReversing(null);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reverse payment #{reversing?.id}</DialogTitle>
                        <DialogDescription>
                            Restore {reversing?.amount} {reversing?.currency} to the invoice balance. The original payment stays in history.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (reversing)
                                reversal.post(route('admin.payments.reverse', reversing.id), {
                                    preserveScroll: true,
                                    onSuccess: () => setReversing(null),
                                });
                        }}
                    >
                        {errors(reversal.errors)}
                        <div className="space-y-2">
                            <Label htmlFor="reversal-reason">Reversal reason</Label>
                            <Textarea
                                id="reversal-reason"
                                value={reversal.data.reason}
                                onChange={(e) => reversal.setData('reason', e.target.value)}
                                maxLength={2000}
                                required
                                disabled={reversal.processing}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" disabled={reversal.processing} onClick={() => setReversing(null)}>
                                Keep payment
                            </Button>
                            <Button type="submit" disabled={reversal.processing || reversal.data.reason.trim().length < 3}>
                                {reversal.processing ? 'Reversing…' : 'Confirm reversal'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
