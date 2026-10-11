import { BillingPageContainer as PageContainer } from '@billing/components/billing-page-container';
import { Head, Link, useForm } from '@inertiajs/react';
import { DateField } from '@shared/components/date-field';
import { IndexHeader } from '@shared/components/index-header';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import AppLayout from '@shared/layouts/app-layout';
import { FileMinus2 as BillingPageIcon } from 'lucide-react';
import { useState } from 'react';
import { BillingFeedback } from '../../components/billing-feedback';
import { BillingSelect, BillingSelectItem } from '../../components/billing-select';
import { BillingSummary } from '../../components/billing-summary';
import type { CreditData } from '../../components/invoice-credit-notes';
import { useBillingConfirm } from '../../components/use-billing-confirm';
import type { PaymentMethod } from '../../payment-types';
export default function CreditShow({
    credit,
    reviewToken,
    reviewError,
    invoices,
    allocations,
    refunds,
    methods,
    can,
    today,
    message,
}: {
    credit: CreditData;
    reviewToken: string | null;
    reviewError: string | null;
    invoices: { id: number; number: string; balance: string }[];
    allocations: { id: number; invoice_id: number; amount: string; reversed_at: string | null; reversal_reason: string | null }[];
    refunds: {
        id: number;
        amount: string;
        refund_date: string;
        method: string;
        reference: string | null;
        reason: string;
        reversed_at: string | null;
        reversal_reason: string | null;
    }[];
    methods: PaymentMethod[];
    can: Record<string, boolean>;
    today: string;
    message?: string;
}) {
    const { confirm, dialog } = useBillingConfirm();
    const [allocateOpen, setAllocateOpen] = useState(false);
    const [refundOpen, setRefundOpen] = useState(false);
    const [correcting, setCorrecting] = useState<{ kind: 'cancel' | 'allocation' | 'refund'; id?: number } | null>(null);
    const issue = useForm({ version: credit.version, review_token: reviewToken ?? '' });
    const allocation = useForm({ invoice_id: '', amount: '', request_key: '' });
    const refund = useForm({ amount: '', refund_date: today, method: methods[0]?.value ?? '', reference: '', reason: '', request_key: '' });
    const correction = useForm({ reason: '' });
    const edit = useForm({ version: credit.version, reason: credit.reason });
    const issued = credit.status === 'issued';
    const errors = (values: Record<string, string>) =>
        Object.values(values).length > 0 && (
            <BillingFeedback kind="error">
                {Object.values(values).map((error, i) => (
                    <p key={i}>{error}</p>
                ))}
            </BillingFeedback>
        );
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Credit notes', href: route('admin.credit-notes.index') },
                { title: credit.formatted_number ?? `Draft #${credit.id}`, href: route('admin.credit-notes.show', credit.id) },
            ]}
        >
            {dialog}
            <Head title={credit.formatted_number ?? 'Draft credit'} />
            <PageContainer className="max-w-5xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <IndexHeader title={credit.formatted_number ?? `Draft credit #${credit.id}`} icon={BillingPageIcon} />
                        <Badge variant={credit.status === 'issued' ? 'success' : 'outline'}>
                            {credit.status.charAt(0).toUpperCase() + credit.status.slice(1)}
                        </Badge>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href={route('admin.invoices.show', credit.invoice_id)}>Original invoice</Link>
                    </Button>
                </div>
                {message && <BillingFeedback kind="success">{message}</BillingFeedback>}
                {reviewError && <BillingFeedback kind="error">{reviewError}</BillingFeedback>}
                {errors(issue.errors)}
                <div className="flex flex-wrap gap-3">
                    {credit.status === 'draft' && can.issue && reviewToken && (
                        <Button
                            disabled={issue.processing}
                            onClick={async () => {
                                if (await confirm('Issue this credit with a permanent number?')) {
                                    issue.transform(() => ({ version: credit.version, review_token: reviewToken }));
                                    issue.post(route('admin.credit-notes.issue', credit.id));
                                }
                            }}
                        >
                            Issue credit note
                        </Button>
                    )}
                    {issued && can.allocate && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                allocation.clearErrors();
                                allocation.setData({ invoice_id: '', amount: credit.settlement.available, request_key: crypto.randomUUID() });
                                setAllocateOpen(true);
                            }}
                        >
                            Allocate credit
                        </Button>
                    )}
                    {issued && can.refund && (
                        <Button
                            variant="outline"
                            disabled={methods.length === 0}
                            onClick={() => {
                                refund.clearErrors();
                                refund.setData({
                                    amount: '',
                                    refund_date: today,
                                    method: methods[0]?.value ?? '',
                                    reference: '',
                                    reason: '',
                                    request_key: crypto.randomUUID(),
                                });
                                setRefundOpen(true);
                            }}
                        >
                            Record refund
                        </Button>
                    )}
                    {credit.status !== 'cancelled' && can.cancel && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                correction.clearErrors();
                                correction.setData('reason', '');
                                setCorrecting({ kind: 'cancel' });
                            }}
                        >
                            Cancel credit
                        </Button>
                    )}
                </div>
                <Button variant="outline" asChild>
                    <a href={route('admin.credit-notes.pdf', credit.id)}>Download credit PDF</a>
                </Button>
                <BillingSummary
                    items={[
                        { label: 'Credit total', value: credit.total, currency: credit.currency },
                        { label: 'Allocated to invoices', value: credit.settlement.allocated, currency: credit.currency },
                        { label: 'Refunded', value: credit.settlement.refunded, currency: credit.currency },
                        { label: 'Available credit', value: credit.settlement.available, currency: credit.currency, emphasis: true },
                    ]}
                />
                <Card>
                    <CardHeader>
                        <CardTitle>Credit details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p>{credit.credit_date}</p>
                        <p>{credit.customer_snapshot.legal_name || credit.customer_snapshot.display_name}</p>
                        <p className="whitespace-pre-wrap">{credit.reason}</p>
                        <p>
                            Before tax: {credit.subtotal} {credit.currency}
                        </p>
                        {credit.taxes.map((t, i) => (
                            <p key={i}>
                                {t.name} ({t.percentage}%): {t.amount} {credit.currency}
                            </p>
                        ))}
                        {credit.cancellation_reason && <p>Cancelled: {credit.cancellation_reason}</p>}
                    </CardContent>
                </Card>
                {credit.status === 'draft' && can.update && (
                    <Card>
                        <CardContent className="pt-6">
                            <form
                                className="space-y-3"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    edit.transform((d) => ({ ...d, version: credit.version }));
                                    edit.patch(route('admin.credit-notes.update', credit.id));
                                }}
                            >
                                <Label htmlFor="edit-credit-reason">Draft reason</Label>
                                <Textarea id="edit-credit-reason" value={edit.data.reason} onChange={(e) => edit.setData('reason', e.target.value)} />
                                {errors(edit.errors)}
                                <Button type="submit" variant="outline" disabled={edit.processing}>
                                    Update reason
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
                <Card>
                    <CardHeader>
                        <CardTitle>Allocations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="divide-y">
                            {allocations.map((a) => (
                                <li key={a.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm">
                                    <span>
                                        Invoice #{a.invoice_id}: {a.amount} {credit.currency} · {a.reversed_at ? 'Reversed' : 'Active'}
                                        {a.reversal_reason && ` - ${a.reversal_reason}`}
                                    </span>
                                    {!a.reversed_at && can['reverse allocation'] && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                correction.clearErrors();
                                                correction.setData('reason', '');
                                                setCorrecting({ kind: 'allocation', id: a.id });
                                            }}
                                        >
                                            Reverse allocation
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Refund records</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="divide-y">
                            {refunds.map((r) => (
                                <li key={r.id} className="space-y-2 py-3 text-sm">
                                    <div className="flex flex-wrap justify-between gap-3">
                                        <span>
                                            {r.amount} {credit.currency} · {r.refund_date} · {r.method} · {r.reversed_at ? 'Reversed' : 'Active'}
                                        </span>
                                        {!r.reversed_at && can.refund && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    correction.clearErrors();
                                                    correction.setData('reason', '');
                                                    setCorrecting({ kind: 'refund', id: r.id });
                                                }}
                                            >
                                                Reverse refund record
                                            </Button>
                                        )}
                                    </div>
                                    <p>
                                        {r.reason}
                                        {r.reference && ` - ${r.reference}`}
                                    </p>
                                    {r.reversal_reason && <p>{r.reversal_reason}</p>}
                                </li>
                            ))}
                        </ol>
                    </CardContent>
                </Card>
            </PageContainer>
            <Dialog
                open={allocateOpen}
                onOpenChange={(v) => {
                    if (!allocation.processing) setAllocateOpen(v);
                }}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Allocate credit</DialogTitle>
                        <DialogDescription>Apply available credit to an issued invoice for the same customer and currency.</DialogDescription>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            allocation.post(route('admin.credit-notes.allocate', credit.id), { onSuccess: () => setAllocateOpen(false) });
                        }}
                    >
                        {errors(allocation.errors)}
                        <Label htmlFor="allocation-invoice">Invoice</Label>
                        <BillingSelect
                            id="allocation-invoice"
                            value={allocation.data.invoice_id}
                            onValueChange={(v) => allocation.setData('invoice_id', v)}
                        >
                            {invoices.map((i) => (
                                <BillingSelectItem key={i.id} value={i.id}>
                                    {i.number} - balance {i.balance} {credit.currency}
                                </BillingSelectItem>
                            ))}
                        </BillingSelect>
                        <Label htmlFor="allocation-amount">Allocation amount ({credit.currency})</Label>
                        <Input
                            id="allocation-amount"
                            inputMode="decimal"
                            value={allocation.data.amount}
                            onChange={(e) => allocation.setData('amount', e.target.value)}
                            required
                        />
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setAllocateOpen(false)}>
                                Close
                            </Button>
                            <Button type="submit" disabled={allocation.processing}>
                                Apply credit
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog
                open={refundOpen}
                onOpenChange={(v) => {
                    if (!refund.processing) setRefundOpen(v);
                }}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Record refund already made</DialogTitle>
                        <DialogDescription>
                            Record an actual refund from unused credit. This does not charge a card or initiate a provider refund.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            refund.post(route('admin.credit-notes.refund', credit.id), { onSuccess: () => setRefundOpen(false) });
                        }}
                    >
                        {errors(refund.errors)}
                        <Label htmlFor="refund-amount">Refund amount ({credit.currency})</Label>
                        <Input
                            id="refund-amount"
                            inputMode="decimal"
                            value={refund.data.amount}
                            onChange={(e) => refund.setData('amount', e.target.value)}
                            required
                        />
                        <Label htmlFor="refund-date">Refund date</Label>
                        <DateField
                            id="refund-date"
                            label="Refund date"
                            value={refund.data.refund_date}
                            onChange={(v) => refund.setData('refund_date', v)}
                        />
                        <Label htmlFor="refund-method">Refund method</Label>
                        <BillingSelect id="refund-method" value={refund.data.method} onValueChange={(v) => refund.setData('method', v)}>
                            {methods.map((m) => (
                                <BillingSelectItem key={m.value} value={m.value}>
                                    {m.label}
                                </BillingSelectItem>
                            ))}
                        </BillingSelect>
                        <Label htmlFor="refund-reference">Reference</Label>
                        <Input
                            id="refund-reference"
                            value={refund.data.reference}
                            onChange={(e) => refund.setData('reference', e.target.value)}
                            maxLength={255}
                        />
                        <Label htmlFor="refund-reason">Refund reason</Label>
                        <Textarea
                            id="refund-reason"
                            value={refund.data.reason}
                            onChange={(e) => refund.setData('reason', e.target.value)}
                            maxLength={2000}
                            required
                        />
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setRefundOpen(false)}>
                                Close
                            </Button>
                            <Button type="submit" disabled={refund.processing}>
                                Save refund record
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog
                open={correcting !== null}
                onOpenChange={(v) => {
                    if (!correction.processing && !v) setCorrecting(null);
                }}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {correcting?.kind === 'cancel'
                                ? 'Cancel credit'
                                : correcting?.kind === 'allocation'
                                  ? 'Reverse allocation'
                                  : 'Reverse refund record'}
                        </DialogTitle>
                        <DialogDescription>A reason is required. Original records remain in the audit history.</DialogDescription>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!correcting) return;
                            const url =
                                correcting.kind === 'cancel'
                                    ? route('admin.credit-notes.cancel', credit.id)
                                    : route(
                                          correcting.kind === 'allocation'
                                              ? 'admin.credit-notes.allocations.reverse'
                                              : 'admin.credit-notes.refunds.reverse',
                                          [credit.id, correcting.id],
                                      );
                            correction.post(url, { onSuccess: () => setCorrecting(null) });
                        }}
                    >
                        {errors(correction.errors)}
                        <Label htmlFor="credit-correction-reason">Correction reason</Label>
                        <Textarea
                            id="credit-correction-reason"
                            value={correction.data.reason}
                            onChange={(e) => correction.setData('reason', e.target.value)}
                            minLength={3}
                            maxLength={2000}
                            required
                        />
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setCorrecting(null)}>
                                Keep record
                            </Button>
                            <Button type="submit" disabled={correction.processing || correction.data.reason.trim().length < 3}>
                                Confirm correction
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
