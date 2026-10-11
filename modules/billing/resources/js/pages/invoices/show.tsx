import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { AdminPageContent } from '@shared/components/admin-page-content';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Label } from '@shared/components/ui/label';
import { ContentTabs } from '@shared/components/ui/tabs-in-cell-for-navigation';
import { Textarea } from '@shared/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/components/ui/tooltip';
import AppLayout from '@shared/layouts/app-layout';
import { statusTone } from '@shared/lib/status-colors';
import { ArrowLeft, CreditCard, Ellipsis, FileMinus2, FileText, History, Mail, StickyNote } from 'lucide-react';
import { useRef, useState } from 'react';
import { BillingFeedback } from '../../components/billing-feedback';
import { InvoiceCreditNotes, type CreditData } from '../../components/invoice-credit-notes';
import type { Delivery } from '../../components/invoice-delivery';
import { InvoiceHistory, type InvoiceActivity } from '../../components/invoice-document';
import type { PrivateInvoiceLink } from '../../components/invoice-links';
import { InvoiceNotification } from '../../components/invoice-notification';
import { InvoicePayments } from '../../components/invoice-payments';
import { InvoicePdfButtons } from '../../components/invoice-pdf-buttons';
import { InvoicePreview } from '../../components/invoice-preview';
import { InvoiceSharingDialog } from '../../components/invoice-sharing-dialog';
import type { InvoiceData } from '../../invoice-types';
import type { PaymentData, PaymentMethod, Settlement } from '../../payment-types';

export default function IssuedInvoice({
    canUpdateInternalNote,
    canCreateCredit,
    credits,
    canCheckout,
    remindersDisabled,
    canRemind,
    canShare,
    links,
    shareUrl,
    canSend,
    deliveries,
    canDownloadPdf,
    pdfError,
    invoice,
    settlement,
    payments,
    canRecordPayment,
    paymentMethods,
    today,
    canCancel,
    activities,
    message,
}: {
    canUpdateInternalNote: boolean;
    canCreateCredit: boolean;
    credits: CreditData[] | null;
    canCheckout: boolean;
    remindersDisabled: boolean;
    canRemind: boolean;
    canShare: boolean;
    links: PrivateInvoiceLink[] | null;
    shareUrl: string | null;
    canSend: boolean;
    deliveries: Delivery[] | null;
    canDownloadPdf: boolean;
    pdfError?: string;
    invoice: InvoiceData;
    settlement: Settlement;
    payments: PaymentData[] | null;
    canRecordPayment: boolean;
    paymentMethods: PaymentMethod[];
    today: string;
    canCancel: boolean;
    activities: InvoiceActivity[];
    message?: string;
}) {
    const { url } = usePage();
    const requestedTab = new URL(url, 'http://localhost').searchParams.get('tab') ?? 'overview';
    const initialTab = ['overview', 'payments', 'credits', 'notes', 'history'].includes(requestedTab) ? requestedTab : 'overview';
    const [sharingOpen, setSharingOpen] = useState(requestedTab === 'sharing' || !!shareUrl);
    const moreActionsRef = useRef<HTMLButtonElement>(null);
    const hasSharing = canRemind || canShare || canSend || links !== null || deliveries !== null;
    const onSharingOpenChange = (open: boolean) => {
        setSharingOpen(open);
        if (!open && requestedTab === 'sharing') {
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
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Invoices', href: route('admin.invoices.index') },
                { title: invoice.formatted_number ?? 'Invoice', href: route('admin.invoices.show', invoice.id) },
            ]}
        >
            <Head title={invoice.formatted_number ?? 'Invoice'} />
            <AdminPageContent>
                <InvoiceNotification message={message} response={invoice} />
                <header className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                        <Link
                            href={route('admin.invoices.index')}
                            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs"
                        >
                            <ArrowLeft className="size-3.5" />
                            All invoices
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight">{invoice.formatted_number ?? 'Invoice'}</h1>
                            <Badge variant={statusTone(invoice.status === 'cancelled' ? 'cancelled' : settlement.state)}>
                                {invoice.status === 'cancelled'
                                    ? 'Cancelled'
                                    : settlement.state === 'paid'
                                      ? 'Paid'
                                      : settlement.state === 'partial'
                                        ? 'Partially paid'
                                        : settlement.state === 'settled'
                                          ? 'Settled'
                                          : 'Unpaid'}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {invoice.customer_snapshot.legal_name || invoice.customer_snapshot.display_name}
                        </p>
                        <dl className="flex flex-wrap gap-x-5 gap-y-2 pt-1 text-xs">
                            <div className="flex gap-2">
                                <dt className="text-muted-foreground">Invoice date</dt>
                                <dd className="font-medium">{invoice.invoice_date}</dd>
                            </div>
                            <div className="flex gap-2">
                                <dt className="text-muted-foreground">Due date</dt>
                                <dd className="font-medium">{invoice.due_date || '—'}</dd>
                            </div>
                            <div className="flex gap-2">
                                <dt className="text-muted-foreground">Currency</dt>
                                <dd className="font-medium">{invoice.currency}</dd>
                            </div>
                        </dl>
                    </div>
                    <div className="invoice-toolbar flex flex-wrap items-center gap-2">
                        {canDownloadPdf && <InvoicePdfButtons invoiceId={invoice.id} iconOnly />}
                        {(hasSharing || canCheckout || canUpdateInternalNote || canCancel) && (
                            <DropdownMenu>
                                <TooltipProvider delayDuration={150}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <DropdownMenuTrigger asChild>
                                                <Button ref={moreActionsRef} variant="outline" size="icon" aria-label="More actions">
                                                    <Ellipsis />
                                                </Button>
                                            </DropdownMenuTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>More actions</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                <DropdownMenuContent align="end">
                                    {hasSharing && (
                                        <DropdownMenuItem onSelect={() => setSharingOpen(true)}>
                                            <Mail />
                                            Email & sharing
                                        </DropdownMenuItem>
                                    )}
                                    {canUpdateInternalNote && (
                                        <DropdownMenuItem
                                            onSelect={() => {
                                                noteForm.clearErrors();
                                                noteForm.setData({ version: invoice.version, internal_note: invoice.internal_note ?? '' });
                                                setEditingNote(true);
                                            }}
                                        >
                                            Edit internal note
                                        </DropdownMenuItem>
                                    )}
                                    {canCheckout && (
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                router.post(route('admin.invoices.checkout', invoice.id), { request_key: crypto.randomUUID() })
                                            }
                                        >
                                            Open online checkout
                                        </DropdownMenuItem>
                                    )}
                                    {canCancel && (
                                        <DropdownMenuItem
                                            className="text-destructive"
                                            onSelect={() => {
                                                form.clearErrors();
                                                form.setData('version', invoice.version);
                                                setCancelling(true);
                                            }}
                                        >
                                            Cancel invoice
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </header>
                {pdfError && <BillingFeedback kind="error">{pdfError}</BillingFeedback>}
                {invoice.status === 'cancelled' && (
                    <BillingFeedback kind="error" title="Cancelled invoice">
                        {invoice.cancellation_reason || 'This invoice was cancelled. Its number and history are preserved.'}
                    </BillingFeedback>
                )}
                <ContentTabs
                    defaultValue={initialTab}
                    tabs={[
                        {
                            value: 'overview',
                            label: 'Overview',
                            icon: FileText,
                            content: <InvoicePreview embedded showMetadata={false} invoice={invoice} settlement={settlement} />,
                        },
                        {
                            value: 'payments',
                            label: 'Payments',
                            count: payments?.length,
                            icon: CreditCard,
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
                            icon: FileMinus2,
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
                            value: 'notes',
                            label: 'Notes',
                            icon: StickyNote,
                            content: (
                                <section className="space-y-3">
                                    <div>
                                        <h2 className="font-semibold">Internal note</h2>
                                        <p className="text-muted-foreground mt-1 text-xs">Visible to staff only; excluded from customer documents.</p>
                                    </div>
                                    <p className="text-sm leading-6 whitespace-pre-line">{invoice.internal_note || 'No internal note added.'}</p>
                                    {canUpdateInternalNote && (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                noteForm.clearErrors();
                                                noteForm.setData({ version: invoice.version, internal_note: invoice.internal_note ?? '' });
                                                setEditingNote(true);
                                            }}
                                        >
                                            Edit internal note
                                        </Button>
                                    )}
                                </section>
                            ),
                        },
                        {
                            value: 'history',
                            label: 'Activity',
                            count: activities.length,
                            icon: History,
                            content: <InvoiceHistory embedded activities={activities} />,
                        },
                    ]}
                />
            </AdminPageContent>
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
                    deliveries={deliveries}
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
