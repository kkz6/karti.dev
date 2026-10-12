import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { DateField } from '@shared/components/date-field';
import { PageContainer } from '@shared/components/page-container';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import AppLayout from '@shared/layouts/app-layout';
import { cn } from '@shared/lib/utils';
import { ArrowRightLeft, BadgeCheck, Ban, Download, Ellipsis, FileMinus2, FileText, Undo2, Wallet } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { BillingFeedback } from '../../components/billing-feedback';
import { BillingSelect, BillingSelectItem } from '../../components/billing-select';
import { AsideCard, Detail, DetailHeader, DetailTabs, initialTab } from '../../components/detail-page';
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
    const { url } = usePage();
    const [tab, setTab] = useState(initialTab(url, ['overview', 'allocations', 'refunds']));
    const errors = (values: Record<string, string>) =>
        Object.values(values).length > 0 && (
            <BillingFeedback kind="error">
                {Object.values(values).map((error, i) => (
                    <p key={i}>{error}</p>
                ))}
            </BillingFeedback>
        );
    const total = Number(credit.total) || 0;
    const usedShare = total > 0 ? Math.min(100, ((Number(credit.settlement.allocated) + Number(credit.settlement.refunded)) / total) * 100) : 0;
    const customerName = credit.customer_snapshot.legal_name || credit.customer_snapshot.display_name;
    const statusBadge = (
        <Badge variant={credit.status === 'issued' ? 'success' : credit.status === 'cancelled' ? 'destructive' : 'outline'}>
            {credit.status.charAt(0).toUpperCase() + credit.status.slice(1)}
        </Badge>
    );
    const canIssue = credit.status === 'draft' && can.issue && !!reviewToken;
    const issueCredit = async () => {
        if (await confirm('Issue this credit with a permanent number?')) {
            issue.transform(() => ({ version: credit.version, review_token: reviewToken ?? '' }));
            issue.post(route('admin.credit-notes.issue', credit.id));
        }
    };
    const openAllocate = () => {
        allocation.clearErrors();
        allocation.setData({ invoice_id: '', amount: credit.settlement.available, request_key: crypto.randomUUID() });
        setAllocateOpen(true);
    };
    const openRefund = () => {
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
    };
    const openCorrection = (kind: 'cancel' | 'allocation' | 'refund', id?: number) => {
        correction.clearErrors();
        correction.setData('reason', '');
        setCorrecting({ kind, id });
    };
    const primaryAction = (size: 'sm' | 'default') =>
        canIssue ? (
            <Button size={size} disabled={issue.processing} onClick={issueCredit}>
                <BadgeCheck className="size-4" />
                Issue credit note
            </Button>
        ) : (
            <Button size={size} asChild>
                <a href={route('admin.credit-notes.pdf', credit.id)}>
                    <Download className="size-4" />
                    Download PDF
                </a>
            </Button>
        );
    const moreActions = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More actions">
                    <Ellipsis className="size-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={route('admin.invoices.show', credit.invoice_id)}>
                        <FileText />
                        Original invoice
                    </Link>
                </DropdownMenuItem>
                {canIssue && (
                    <DropdownMenuItem asChild>
                        <a href={route('admin.credit-notes.pdf', credit.id)}>
                            <Download />
                            Download PDF
                        </a>
                    </DropdownMenuItem>
                )}
                {issued && can.allocate && (
                    <DropdownMenuItem onSelect={openAllocate}>
                        <ArrowRightLeft />
                        Allocate credit
                    </DropdownMenuItem>
                )}
                {issued && can.refund && (
                    <DropdownMenuItem onSelect={openRefund} disabled={methods.length === 0}>
                        <Undo2 />
                        Record refund
                    </DropdownMenuItem>
                )}
                {credit.status !== 'cancelled' && can.cancel && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => openCorrection('cancel')}>
                            <Ban />
                            Cancel credit
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
    const emptyState = (title: string, description: string) => (
        <div className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-5">
            <FileMinus2 className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-muted-foreground mt-1 text-sm">{description}</p>
            </div>
        </div>
    );
    const sectionHeading = (title: string, action?: ReactNode) => (
        <div className="flex items-center justify-between gap-3">
            <h2 className="text-[0.9375rem] font-semibold">{title}</h2>
            {action}
        </div>
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

            <PageContainer className="content-editor">
                <DetailHeader
                    stickyMeta={
                        issued && (
                            <>
                                <span className="text-muted-foreground">Available </span>
                                <span className="font-semibold">
                                    {credit.settlement.available} {credit.currency}
                                </span>
                            </>
                        )
                    }
                    stickyActions={primaryAction('sm')}
                    title={credit.formatted_number ?? `Draft credit #${credit.id}`}
                    badges={statusBadge}
                    subtitle={`${customerName} · ${credit.total} ${credit.currency}`}
                    actions={
                        <>
                            {moreActions}
                            {primaryAction('default')}
                        </>
                    }
                />
                <div className="space-y-4 empty:hidden">
                    {reviewError && <BillingFeedback kind="error">{reviewError}</BillingFeedback>}
                    {errors(issue.errors)}
                    {credit.status === 'cancelled' && (
                        <BillingFeedback kind="error" title="Cancelled credit note">
                            {credit.cancellation_reason || 'This credit note was cancelled. Its history is preserved.'}
                        </BillingFeedback>
                    )}
                </div>
                <DetailTabs
                    label="Credit note"
                    value={tab}
                    onValueChange={setTab}
                    tabs={[
                        {
                            value: 'overview',
                            label: 'Overview',
                            content: (
                                <section className="space-y-6">
                                    <div>
                                        <p className="text-muted-foreground text-[0.6875rem] font-medium tracking-wider uppercase">Reason</p>
                                        <p className="mt-1.5 text-sm leading-6 break-words whitespace-pre-wrap">{credit.reason}</p>
                                    </div>
                                    <div className="flex justify-end border-t pt-5">
                                        <dl className="w-full max-w-xs space-y-2.5 text-sm tabular-nums">
                                            <Detail label="Before tax">
                                                {credit.subtotal} <span className="text-muted-foreground text-xs">{credit.currency}</span>
                                            </Detail>
                                            {credit.taxes.map((t, i) => (
                                                <Detail key={i} label={`${t.name} (${t.percentage}%)`}>
                                                    {t.amount} <span className="text-muted-foreground text-xs">{credit.currency}</span>
                                                </Detail>
                                            ))}
                                            <div className="flex items-baseline justify-between gap-4 border-t pt-3 font-semibold">
                                                <dt>Credit total</dt>
                                                <dd className="text-base">
                                                    {credit.total}{' '}
                                                    <span className="text-muted-foreground text-xs font-normal">{credit.currency}</span>
                                                </dd>
                                            </div>
                                        </dl>
                                    </div>
                                    {credit.status === 'draft' && can.update && (
                                        <form
                                            className="space-y-3 border-t pt-6"
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                edit.transform((d) => ({ ...d, version: credit.version }));
                                                edit.patch(route('admin.credit-notes.update', credit.id));
                                            }}
                                        >
                                            <Label htmlFor="edit-credit-reason">Draft reason</Label>
                                            <Textarea
                                                id="edit-credit-reason"
                                                value={edit.data.reason}
                                                onChange={(e) => edit.setData('reason', e.target.value)}
                                            />
                                            {errors(edit.errors)}
                                            <Button type="submit" variant="outline" disabled={edit.processing}>
                                                Update reason
                                            </Button>
                                        </form>
                                    )}
                                </section>
                            ),
                        },
                        {
                            value: 'allocations',
                            label: 'Allocations',
                            count: allocations.length,
                            content: (
                                <section className="space-y-4">
                                    {sectionHeading(
                                        'Allocations',
                                        issued && can.allocate && (
                                            <Button variant="outline" size="sm" onClick={openAllocate}>
                                                <ArrowRightLeft className="size-4" />
                                                Allocate credit
                                            </Button>
                                        ),
                                    )}
                                    {allocations.length === 0 ? (
                                        emptyState('No allocations yet', 'Credit applied to invoices will appear here.')
                                    ) : (
                                        <ul className="divide-y rounded-lg border">
                                            {allocations.map((a) => (
                                                <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <Link
                                                                href={route('admin.invoices.show', a.invoice_id)}
                                                                className="font-medium hover:underline"
                                                            >
                                                                {invoices.find((i) => i.id === a.invoice_id)?.number ?? `Invoice #${a.invoice_id}`}
                                                            </Link>
                                                            <Badge variant={a.reversed_at ? 'muted' : 'success'}>
                                                                {a.reversed_at ? 'Reversed' : 'Active'}
                                                            </Badge>
                                                        </div>
                                                        {a.reversal_reason && (
                                                            <p className="text-muted-foreground mt-1 text-xs">{a.reversal_reason}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={cn(
                                                                'font-medium tabular-nums',
                                                                a.reversed_at && 'text-muted-foreground line-through',
                                                            )}
                                                        >
                                                            {a.amount}{' '}
                                                            <span className="text-muted-foreground text-xs font-normal">{credit.currency}</span>
                                                        </span>
                                                        {!a.reversed_at && can['reverse allocation'] && (
                                                            <Button size="sm" variant="ghost" onClick={() => openCorrection('allocation', a.id)}>
                                                                Reverse
                                                            </Button>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            ),
                        },
                        {
                            value: 'refunds',
                            label: 'Refunds',
                            count: refunds.length,
                            content: (
                                <section className="space-y-4">
                                    {sectionHeading(
                                        'Refund records',
                                        issued && can.refund && (
                                            <Button variant="outline" size="sm" onClick={openRefund} disabled={methods.length === 0}>
                                                <Undo2 className="size-4" />
                                                Record refund
                                            </Button>
                                        ),
                                    )}
                                    {refunds.length === 0 ? (
                                        emptyState('No refunds recorded', 'Refunds paid out from unused credit will appear here.')
                                    ) : (
                                        <ul className="divide-y rounded-lg border">
                                            {refunds.map((r) => (
                                                <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 p-4 text-sm">
                                                    <div className="min-w-0 space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="font-medium">{r.method}</span>
                                                            <span className="text-muted-foreground tabular-nums">{r.refund_date}</span>
                                                            <Badge variant={r.reversed_at ? 'muted' : 'success'}>
                                                                {r.reversed_at ? 'Reversed' : 'Active'}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-muted-foreground break-words">
                                                            {r.reason}
                                                            {r.reference && ` · ${r.reference}`}
                                                        </p>
                                                        {r.reversal_reason && <p className="text-muted-foreground text-xs">{r.reversal_reason}</p>}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={cn(
                                                                'font-medium tabular-nums',
                                                                r.reversed_at && 'text-muted-foreground line-through',
                                                            )}
                                                        >
                                                            {r.amount}{' '}
                                                            <span className="text-muted-foreground text-xs font-normal">{credit.currency}</span>
                                                        </span>
                                                        {!r.reversed_at && can.refund && (
                                                            <Button size="sm" variant="ghost" onClick={() => openCorrection('refund', r.id)}>
                                                                Reverse
                                                            </Button>
                                                        )}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </section>
                            ),
                        },
                    ]}
                    aside={
                        <>
                            <AsideCard title="Credit balance" icon={Wallet} description={`Credit in ${credit.currency}`}>
                                <div>
                                    <p className="text-muted-foreground text-xs">Available credit</p>
                                    <p className={cn('mt-1 text-2xl font-semibold tracking-tight tabular-nums', !issued && 'text-muted-foreground')}>
                                        {credit.settlement.available}{' '}
                                        <span className="text-muted-foreground text-xs font-normal">{credit.currency}</span>
                                    </p>
                                    {issued && (
                                        <div
                                            className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full"
                                            role="progressbar"
                                            aria-label="Used"
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-valuenow={Math.round(usedShare)}
                                        >
                                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${usedShare}%` }} />
                                        </div>
                                    )}
                                </div>
                                <dl className="space-y-2 border-t pt-3 text-sm">
                                    <Detail label="Credit total">{credit.total}</Detail>
                                    <Detail label="Allocated">{credit.settlement.allocated}</Detail>
                                    <Detail label="Refunded">{credit.settlement.refunded}</Detail>
                                </dl>
                                {issued && can.allocate && (
                                    <Button variant="outline" size="sm" className="w-full" onClick={openAllocate}>
                                        <ArrowRightLeft className="size-4" />
                                        Allocate credit
                                    </Button>
                                )}
                            </AsideCard>
                            <AsideCard title="Details">
                                <dl className="space-y-3 text-sm">
                                    <Detail label="Customer">
                                        <Link href={route('admin.customers.show', credit.customer_id)} className="font-medium hover:underline">
                                            {customerName}
                                        </Link>
                                    </Detail>
                                    <Detail label="Invoice">
                                        <Link href={route('admin.invoices.show', credit.invoice_id)} className="font-medium hover:underline">
                                            View original
                                        </Link>
                                    </Detail>
                                    <Detail label="Credit date">{credit.credit_date}</Detail>
                                    <Detail label="Currency">{credit.currency}</Detail>
                                </dl>
                            </AsideCard>
                        </>
                    }
                />
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
