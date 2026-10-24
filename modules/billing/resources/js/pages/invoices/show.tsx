import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { PageContainer } from '@shared/components/page-container';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import AppLayout from '@shared/layouts/app-layout';
import { statusTone } from '@shared/lib/status-colors';
import { cn } from '@shared/lib/utils';
import { BadgeCheck, Ban, CreditCard, Download, Ellipsis, ExternalLink, FileText, Mail, Pencil, Receipt, StickyNote, Wallet } from 'lucide-react';
import { useRef, useState } from 'react';
import { BillingFeedback } from '../../components/billing-feedback';
import { AsideCard, Detail, DetailHeader, DetailTabs, initialTab } from '../../components/detail-page';
import { InvoiceComposer } from '../../components/invoice-composer';
import { InvoiceCreditNotes, type CreditData } from '../../components/invoice-credit-notes';
import type { Delivery, DeliveryConfiguration } from '../../components/invoice-delivery';
import { InvoiceHistory, type InvoiceActivity } from '../../components/invoice-document';
import type { PrivateInvoiceLink } from '../../components/invoice-links';
import { InvoicePayments } from '../../components/invoice-payments';
import { InvoicePreview } from '../../components/invoice-preview';
import { InvoiceSharingDialog } from '../../components/invoice-sharing-dialog';
import type { InvoiceData } from '../../invoice-types';
import type { PaymentData, PaymentMethod, Settlement } from '../../payment-types';

export default function InvoiceDetail({
    draft = false,
    canUpdate = false,
    canIssue = false,
    canUpdateInternalNote = false,
    canCreateCredit = false,
    credits = null,
    canCheckout = false,
    remindersDisabled = false,
    canRemind = false,
    canShare = false,
    links = null,
    shareUrl = null,
    canSend = false,
    deliveries = null,
    deliveryConfiguration = null,
    canDownloadPdf,
    pdfError,
    invoice,
    settlement: issuedSettlement,
    payments = null,
    canRecordPayment = false,
    paymentMethods = [],
    today = '',
    canCancel = false,
    activities,
}: {
    /** Drafts render this page with a smaller payload; editing happens in the invoice composer modal. */
    draft?: boolean;
    canUpdate?: boolean;
    canIssue?: boolean;
    canUpdateInternalNote?: boolean;
    canCreateCredit?: boolean;
    credits?: CreditData[] | null;
    canCheckout?: boolean;
    remindersDisabled?: boolean;
    canRemind?: boolean;
    canShare?: boolean;
    links?: PrivateInvoiceLink[] | null;
    shareUrl?: string | null;
    canSend?: boolean;
    deliveries?: Delivery[] | null;
    deliveryConfiguration?: DeliveryConfiguration | null;
    canDownloadPdf: boolean;
    pdfError?: string;
    invoice: InvoiceData;
    settlement?: Settlement;
    payments?: PaymentData[] | null;
    canRecordPayment?: boolean;
    paymentMethods?: PaymentMethod[];
    today?: string;
    canCancel?: boolean;
    activities: InvoiceActivity[];
    message?: string;
}) {
    const { url } = usePage();
    const settlement: Settlement = issuedSettlement ?? {
        credited: '0',
        state: 'draft',
        paid: '0',
        balance: invoice.totals.total,
        overdue: false,
        can_receive: false,
    };
    const [composing, setComposing] = useState(false);
    const title = draft ? `Draft #${invoice.id}` : (invoice.formatted_number ?? 'Invoice');
    const cancelled = invoice.status === 'cancelled';
    const statusLabel = draft
        ? 'Draft'
        : cancelled
          ? 'Cancelled'
          : (({ paid: 'Paid', partial: 'Partially paid', settled: 'Settled' } as Record<string, string>)[settlement.state] ?? 'Unpaid');
    const requestedTab = new URL(url, 'http://localhost').searchParams.get('tab') ?? 'overview';
    const [tab, setTab] = useState(initialTab(url, ['overview', 'payments', 'credits', 'history']));
    const [sharingOpen, setSharingOpen] = useState(requestedTab === 'sharing' || requestedTab === 'send' || !!shareUrl);
    const moreActionsRef = useRef<HTMLButtonElement>(null);
    const hasSharing = canRemind || canShare || canSend || links !== null || deliveries !== null;
    const onSharingOpenChange = (open: boolean) => {
        setSharingOpen(open);
        if (!open && (requestedTab === 'sharing' || requestedTab === 'send')) {
            const nextUrl = new URL(url, 'http://localhost');
            nextUrl.searchParams.delete('tab');
            router.replace({ url: nextUrl.pathname + nextUrl.search, preserveState: true, preserveScroll: true });
        }
    };
    const [editingNote, setEditingNote] = useState(false);
    const noteForm = useForm({ version: invoice.version, internal_note: invoice.internal_note ?? '' });
    const [cancelling, setCancelling] = useState(false);
    const form = useForm({ version: invoice.version, reason: '' });
    const submit = () =>
        form.post(route('admin.invoices.cancel', invoice.id), {
            onSuccess: () => {
                setCancelling(false);
                form.reset();
            },
        });
    const total = Number(invoice.totals.total) || 0;
    const settledShare = total > 0 ? Math.min(100, ((Number(settlement.paid) + Number(settlement.credited)) / total) * 100) : 0;
    const customerName = invoice.customer_snapshot.legal_name || invoice.customer_snapshot.display_name;
    const openNoteEditor = () => {
        noteForm.clearErrors();
        noteForm.setData({ version: invoice.version, internal_note: invoice.internal_note ?? '' });
        setEditingNote(true);
    };
    const reviewLink = route('admin.invoices.issue-review', invoice.id);
    const moreActions = (hasSharing || canCheckout || canUpdateInternalNote || canCancel || (draft && (canDownloadPdf || canIssue))) && (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button ref={moreActionsRef} variant="ghost" size="icon" aria-label="More actions">
                    <Ellipsis className="size-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {draft && canIssue && canUpdate && (
                    <DropdownMenuItem asChild>
                        <Link href={reviewLink}>
                            <BadgeCheck />
                            Review and issue
                        </Link>
                    </DropdownMenuItem>
                )}
                {hasSharing && (
                    <DropdownMenuItem onSelect={() => setSharingOpen(true)}>
                        <Mail />
                        Send & sharing
                    </DropdownMenuItem>
                )}
                {canDownloadPdf && (
                    <DropdownMenuItem asChild>
                        <a href={route('admin.invoices.pdf', invoice.id)} target="_blank" rel="noopener noreferrer">
                            <FileText />
                            {draft ? 'Preview draft PDF' : 'Preview PDF'}
                        </a>
                    </DropdownMenuItem>
                )}
                {draft && canDownloadPdf && (
                    <DropdownMenuItem asChild>
                        <a href={route('admin.invoices.pdf', { invoice: invoice.id, download: 1 })}>
                            <Download />
                            Download PDF
                        </a>
                    </DropdownMenuItem>
                )}
                {canUpdateInternalNote && (
                    <DropdownMenuItem onSelect={openNoteEditor}>
                        <StickyNote />
                        Edit internal note
                    </DropdownMenuItem>
                )}
                {canShare && (
                    <DropdownMenuItem
                        onSelect={() =>
                            router.post(route('admin.invoices.links.store', invoice.id), { days: 90, label: 'Customer payment link', open: true })
                        }
                    >
                        <ExternalLink /> Open payment link
                    </DropdownMenuItem>
                )}
                {canCheckout && (
                    <DropdownMenuItem
                        onSelect={() => router.post(route('admin.invoices.checkout', invoice.id), { request_key: crypto.randomUUID() })}
                    >
                        <CreditCard />
                        Open online checkout
                    </DropdownMenuItem>
                )}
                {canCancel && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => {
                                form.clearErrors();
                                form.setData('version', invoice.version);
                                setCancelling(true);
                            }}
                        >
                            <Ban />
                            Cancel invoice
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
    const primaryAction = (size: 'sm' | 'default') =>
        draft && canUpdate ? (
            <Button size={size} onClick={() => setComposing(true)}>
                <Pencil className="size-4" />
                Edit draft
            </Button>
        ) : draft && canIssue ? (
            <Button size={size} asChild>
                <Link href={reviewLink}>
                    <BadgeCheck className="size-4" />
                    Review and issue
                </Link>
            </Button>
        ) : (
            canDownloadPdf && (
                <Button asChild size={size}>
                    <a href={route('admin.invoices.pdf', { invoice: invoice.id, download: 1 })}>
                        <Download className="size-4" />
                        Download PDF
                    </a>
                </Button>
            )
        );
    const statusBadge = <Badge variant={draft ? 'muted' : statusTone(cancelled ? 'cancelled' : settlement.state)}>{statusLabel}</Badge>;

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Invoices', href: route('admin.invoices.index') },
                { title, href: route('admin.invoices.show', invoice.id) },
            ]}
        >
            <Head title={title} />

            <PageContainer className="content-editor">
                <DetailHeader
                    stickyMeta={
                        !cancelled && (
                            <>
                                <span className="text-muted-foreground">{draft ? 'Total' : 'Due'} </span>
                                <span className="font-semibold">
                                    {settlement.balance} {invoice.currency}
                                </span>
                            </>
                        )
                    }
                    stickyActions={primaryAction('sm')}
                    title={title}
                    badges={
                        <>
                            {statusBadge}
                            {!cancelled && settlement.overdue && <Badge variant="destructive">Overdue</Badge>}
                        </>
                    }
                    subtitle={`${customerName} · ${invoice.totals.total} ${invoice.currency}`}
                    actions={
                        <>
                            {moreActions}
                            {primaryAction('default')}
                        </>
                    }
                />
                <div className="space-y-4 empty:hidden">
                    {pdfError && <BillingFeedback kind="error">{pdfError}</BillingFeedback>}
                    {cancelled && (
                        <BillingFeedback kind="error" title="Cancelled invoice">
                            {invoice.cancellation_reason || 'This invoice was cancelled. Its number and history are preserved.'}
                        </BillingFeedback>
                    )}
                </div>
                <DetailTabs
                    label="Invoice"
                    value={tab}
                    onValueChange={setTab}
                    tabs={[
                        {
                            value: 'overview',
                            label: 'Overview',
                            content: <InvoicePreview embedded invoice={invoice} settlement={draft ? undefined : settlement} />,
                        },
                        {
                            value: 'payments',
                            label: 'Payments',
                            count: payments?.length,
                            content: (
                                <InvoicePayments
                                    embedded
                                    invoice={invoice}
                                    settlement={settlement}
                                    payments={payments}
                                    canRecord={canRecordPayment}
                                    methods={paymentMethods}
                                    today={today}
                                />
                            ),
                        },
                        {
                            value: 'credits',
                            label: 'Credits',
                            count: credits?.length,
                            content: (
                                <InvoiceCreditNotes
                                    embedded
                                    invoiceId={invoice.id}
                                    currency={invoice.currency}
                                    today={today}
                                    canCreate={canCreateCredit}
                                    credits={credits}
                                />
                            ),
                        },
                        {
                            value: 'history',
                            label: 'Activity',
                            count: activities.length,
                            content: <InvoiceHistory embedded activities={activities} />,
                        },
                    ].filter((t) => !draft || t.value === 'overview' || t.value === 'history')}
                    aside={
                        <>
                            {draft ? (
                                <AsideCard title="Draft total" icon={Receipt} description="Not yet issued — no invoice number assigned.">
                                    <p className="text-2xl font-semibold tracking-tight tabular-nums">
                                        {invoice.totals.total} <span className="text-muted-foreground text-xs font-normal">{invoice.currency}</span>
                                    </p>
                                    <dl className="space-y-2 border-t pt-3 text-sm">
                                        <Detail label="Items">{invoice.items.length}</Detail>
                                        <Detail label="Subtotal">{invoice.totals.subtotal}</Detail>
                                        <Detail label="Discount">{invoice.totals.discount}</Detail>
                                        <Detail label="Tax">{invoice.totals.tax}</Detail>
                                    </dl>
                                    {canIssue && (
                                        <Button variant="outline" size="sm" className="w-full" asChild>
                                            <Link href={reviewLink}>
                                                <BadgeCheck className="size-4" />
                                                Review and issue
                                            </Link>
                                        </Button>
                                    )}
                                </AsideCard>
                            ) : (
                                <AsideCard title="Balance" icon={Wallet} description={`Settlement in ${invoice.currency}`}>
                                    <div>
                                        <p className="text-muted-foreground text-xs">{cancelled ? 'Voided amount' : 'Amount due'}</p>
                                        <p
                                            className={cn(
                                                'mt-1 text-2xl font-semibold tracking-tight tabular-nums',
                                                cancelled && 'text-muted-foreground',
                                                !cancelled && settlement.overdue && 'text-red-700 dark:text-red-300',
                                            )}
                                        >
                                            {settlement.balance} <span className="text-muted-foreground text-xs font-normal">{invoice.currency}</span>
                                        </p>
                                        {!cancelled && (
                                            <div
                                                className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full"
                                                role="progressbar"
                                                aria-label="Settled"
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                aria-valuenow={Math.round(settledShare)}
                                            >
                                                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${settledShare}%` }} />
                                            </div>
                                        )}
                                    </div>
                                    <dl className="space-y-2 border-t pt-3 text-sm">
                                        <Detail label="Total">{invoice.totals.total}</Detail>
                                        <Detail label="Paid">{settlement.paid}</Detail>
                                        <Detail label="Credit applied">{settlement.credited}</Detail>
                                    </dl>
                                    {!cancelled && payments !== null && (
                                        <Button variant="outline" size="sm" className="w-full" onClick={() => setTab('payments')}>
                                            <CreditCard className="size-4" />
                                            {canRecordPayment && settlement.can_receive ? 'Record a payment' : 'View payments'}
                                        </Button>
                                    )}
                                </AsideCard>
                            )}

                            <AsideCard title="Details">
                                <dl className="space-y-3 text-sm">
                                    <Detail label="Customer">
                                        <Link href={route('admin.customers.show', invoice.customer_id)} className="font-medium hover:underline">
                                            {customerName}
                                        </Link>
                                    </Detail>
                                    <Detail label="Invoice date">{invoice.invoice_date}</Detail>
                                    <Detail label="Due date">
                                        <span className={cn(!cancelled && settlement.overdue && 'font-medium text-red-700 dark:text-red-300')}>
                                            {invoice.due_date || '—'}
                                        </span>
                                    </Detail>
                                    <Detail label="Currency">{invoice.currency}</Detail>
                                    {invoice.issued_at && <Detail label="Issued">{formatDateTime(invoice.issued_at)}</Detail>}
                                    {invoice.cancelled_at && <Detail label="Cancelled">{formatDateTime(invoice.cancelled_at)}</Detail>}
                                </dl>
                            </AsideCard>

                            <AsideCard
                                title="Internal note"
                                icon={StickyNote}
                                action={
                                    canUpdateInternalNote && (
                                        <Button variant="ghost" size="sm" className="-my-1 -mr-2 h-7" onClick={openNoteEditor}>
                                            {invoice.internal_note ? 'Edit' : 'Add'}
                                        </Button>
                                    )
                                }
                            >
                                <p
                                    className={cn(
                                        'text-sm leading-6 break-words whitespace-pre-line',
                                        !invoice.internal_note && 'text-muted-foreground',
                                    )}
                                >
                                    {invoice.internal_note || 'No internal note added.'}
                                </p>
                                <p className="text-muted-foreground text-xs">Staff only — excluded from customer documents.</p>
                            </AsideCard>
                        </>
                    }
                />
            </PageContainer>
            {draft && canUpdate && <InvoiceComposer invoiceId={invoice.id} open={composing} onClose={() => setComposing(false)} reloadOnly={null} />}
            {hasSharing && (
                <InvoiceSharingDialog
                    open={sharingOpen}
                    onOpenChange={onSharingOpenChange}
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        moreActionsRef.current?.focus({ preventScroll: true });
                    }}
                    invoice={invoice}
                    canShare={canShare}
                    links={links}
                    shareUrl={shareUrl}
                    canSend={canSend}
                    sendOnOpen={requestedTab === 'send'}
                    deliveries={deliveries}
                    configuration={deliveryConfiguration}
                    canRemind={canRemind}
                    remindersDisabled={remindersDisabled}
                />
            )}
            <Dialog
                open={editingNote}
                onOpenChange={(v) => {
                    if (!noteForm.processing) setEditingNote(v);
                }}
            >
                <DialogContent className="max-h-[90dvh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit internal note</DialogTitle>
                        <DialogDescription>
                            This note is visible to staff with invoice access and is excluded from customer PDFs and private links.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            noteForm.patch(route('admin.invoices.internal-note', invoice.id), {
                                preserveScroll: true,
                                onSuccess: () => setEditingNote(false),
                            });
                        }}
                    >
                        <Label htmlFor="issued-internal-note">Internal note</Label>
                        <Textarea
                            id="issued-internal-note"
                            value={noteForm.data.internal_note}
                            onChange={(e) => noteForm.setData('internal_note', e.target.value)}
                            maxLength={10000}
                        />
                        {Object.values(noteForm.errors).length > 0 && (
                            <BillingFeedback kind="error">
                                {Object.values(noteForm.errors).map((error, i) => (
                                    <p key={i}>{error}</p>
                                ))}
                            </BillingFeedback>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingNote(false)}>
                                Close
                            </Button>
                            <Button type="submit" disabled={noteForm.processing}>
                                Save internal note
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <AlertDialog
                open={cancelling}
                onOpenChange={(open) => {
                    if (!form.processing) setCancelling(open);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel invoice</AlertDialogTitle>
                        <AlertDialogDescription>
                            The invoice number and amounts will remain in history. Cancellation requires a reason and is blocked when active payments
                            exist.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Cancellation reason</Label>
                        <Textarea
                            id="reason"
                            value={form.data.reason}
                            onChange={(e) => form.setData('reason', e.target.value)}
                            maxLength={2000}
                            disabled={form.processing}
                        />
                        {Object.values(form.errors).length > 0 && (
                            <BillingFeedback kind="error">
                                {Object.values(form.errors).map((error, i) => (
                                    <p key={i}>{error}</p>
                                ))}
                            </BillingFeedback>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={form.processing}>Keep invoice</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={form.processing || form.data.reason.trim().length < 3}
                            onClick={(event) => {
                                event.preventDefault();
                                submit();
                            }}
                        >
                            {form.processing ? 'Cancelling…' : 'Confirm cancellation'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

function formatDateTime(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
