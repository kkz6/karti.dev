import { router } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Label } from '@shared/components/ui/label';
import axios from 'axios';
import { ArrowLeft, Check, LoaderCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { InvoiceData } from '../invoice-types';
import InvoiceForm, { type InvoiceFormSeed } from '../pages/invoices/form';
import { BillingFeedback } from './billing-feedback';
import { InvoiceDocument } from './invoice-document';
import { InvoicePayments, type InvoicePaymentContext as PaymentContext } from './invoice-payments';
import { InvoiceSaveButton, type InvoiceSaveAction } from './invoice-save-button';
import { useBillingConfirm } from './use-billing-confirm';
type Review = {
    invoice: InvoiceData;
    seller: InvoiceData['seller_snapshot'];
    customer: InvoiceData['customer_snapshot'];
    errors: string[];
    token: string;
    prefix: string;
    padding: number;
};
export function InvoiceComposer({
    open,
    onClose,
    invoiceId,
    customerId,
    reloadOnly = ['table', 'selectedInvoice', 'summary'],
}: {
    open: boolean;
    onClose: () => void;
    invoiceId?: number;
    customerId?: number;
    /** Props refreshed after a save; null reloads the whole page (detail pages). */
    reloadOnly?: string[] | null;
}) {
    const [draggingItem, setDraggingItem] = useState(false);
    const [footerTarget, setFooterTarget] = useState<HTMLDivElement | null>(null);
    const [seed, setSeed] = useState<InvoiceFormSeed | null>(null),
        [review, setReview] = useState<Review | null>(null),
        [stage, setStage] = useState<'edit' | 'review' | 'done'>('edit');
    const [dirty, setDirty] = useState(false),
        [formBusy, setFormBusy] = useState(false),
        [busy, setBusy] = useState(false),
        [error, setError] = useState(''),
        [saved, setSaved] = useState(false),
        [refreshCustomer, setRefreshCustomer] = useState(false),
        [refreshSeller, setRefreshSeller] = useState(true),
        [issued, setIssued] = useState<InvoiceData | null>(null);
    const [saveAction, setSaveAction] = useState<InvoiceSaveAction>('save');
    const [paymentContext, setPaymentContext] = useState<PaymentContext | null>(null);
    const [recordPayment, setRecordPayment] = useState(false);
    const acknowledgePaymentRequest = useCallback(() => setRecordPayment(false), []);
    const { confirm, dialog } = useBillingConfirm();
    const onFormState = useCallback((isDirty: boolean, isBusy: boolean) => {
        setDirty(isDirty);
        setFormBusy(isBusy);
    }, []);
    useEffect(() => {
        if (!open) return;
        const abort = new AbortController();
        setDraggingItem(false);
        setSeed(null);
        setReview(null);
        setStage('edit');
        setError('');
        setDirty(false);
        setSaved(false);
        setIssued(null);
        setSaveAction('save');
        setPaymentContext(null);
        setRecordPayment(false);
        setRefreshSeller(true);
        setRefreshCustomer(false);
        setBusy(true);
        axios
            .get(
                customerId
                    ? invoiceId
                        ? route('admin.customers.invoices.edit', [customerId, invoiceId])
                        : route('admin.customers.invoices.create', customerId)
                    : invoiceId
                      ? route('admin.invoices.edit', invoiceId)
                      : route('admin.invoices.create'),
                {
                    signal: abort.signal,
                    headers: { Accept: 'application/json' },
                },
            )
            .then(({ data }) => setSeed(data))
            .catch((e) => {
                if (!axios.isCancel(e)) setError('The invoice editor could not be loaded. Close and try again.');
            })
            .finally(() => {
                if (!abort.signal.aborted) setBusy(false);
            });
        return () => abort.abort();
    }, [open, invoiceId, customerId]);
    const close = async () => {
        if (busy || formBusy) return;
        if (dirty && !(await confirm('Discard your unsaved invoice changes? Saved draft details will be kept.'))) return;
        if (saved || issued) {
            setBusy(true);
            router.reload({
                ...(reloadOnly ? { only: reloadOnly } : {}),
                onFinish: () => {
                    setBusy(false);
                    onClose();
                },
            });
        } else onClose();
    };
    const loadReview = async (invoice: InvoiceData, seller = refreshSeller, customer = refreshCustomer) => {
        setStage('review');
        setBusy(true);
        setError('');
        setReview(null);
        setDirty(false);
        setFormBusy(false);
        try {
            const { data } = await axios.get(route('admin.invoices.issue-review', invoice.id), {
                params: { refresh_seller: seller ? 1 : 0, refresh_customer: customer ? 1 : 0 },
                headers: { Accept: 'application/json' },
            });
            setReview(data.review);
            setRefreshSeller(data.refreshSeller);
            setRefreshCustomer(data.refreshCustomer);
        } catch {
            setError('The invoice review could not be loaded. Your saved draft is safe. Return to details and try again.');
        } finally {
            setBusy(false);
        }
    };
    const loadPayment = async (invoice: InvoiceData) => {
        setBusy(true);
        setError('');
        try {
            const { data } = await axios.get<PaymentContext>(route('admin.invoices.show', invoice.id), { headers: { Accept: 'application/json' } });
            if (!data.canRecordPayment || !data.settlement.can_receive) {
                setError('The invoice is issued, but it cannot receive another payment. Check its balance and your payment permissions.');
            } else if (!data.paymentMethods.length) {
                setError('The invoice is issued. Enable a manual payment method in Billing settings, then try recording the payment again.');
            } else {
                setPaymentContext(data);
                setRecordPayment(true);
            }
        } catch {
            setError('The invoice is issued, but payment entry could not be loaded. Retry recording the payment below.');
        } finally {
            setBusy(false);
        }
    };
    const issue = async (action: InvoiceSaveAction) => {
        if (!review || busy || review.errors.length) return;
        if (
            !(await confirm(
                action === 'send'
                    ? 'Issue this invoice? Its number and financial details will become permanent. You will review the recipients and message before sending.'
                    : action === 'payment'
                      ? 'Issue this invoice? Its number and financial details will become permanent. You will enter the payment details next; no payment is recorded yet.'
                      : 'Issue this invoice without sending? Its number and financial details will become permanent.',
            ))
        )
            return;
        setBusy(true);
        setError('');
        try {
            const { data } = await axios.post(route('admin.invoices.issue', review.invoice.id), {
                version: review.invoice.version,
                review_token: review.token,
                refresh_seller: refreshSeller,
                refresh_customer: refreshCustomer,
            });
            setIssued(data.invoice);
            setStage('done');
            if (action === 'payment') {
                await loadPayment(data.invoice);
            } else if (action === 'send') {
                onClose();
                router.visit(route('admin.invoices.show', { invoice: data.invoice.id, tab: 'send' }));
            }
        } catch (e) {
            const details = axios.isAxiosError(e)
                ? Object.values(e.response?.data?.errors ?? {})
                      .flat()
                      .map(String)
                : [];
            setError(details.length ? details.join(' ') : 'The invoice could not be issued. Review the invoice again before issuing.');
        } finally {
            setBusy(false);
        }
    };
    return (
        <>
            <Dialog
                open={open && !paymentContext}
                onOpenChange={(value) => {
                    if (!value) void close();
                }}
            >
                <DialogContent
                    overlayClassName="bg-black/45"
                    className="invoice-editor-modal bg-card flex max-h-[94dvh] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl"
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => {
                        e.preventDefault();
                        if (!draggingItem) void close();
                    }}
                >
                    <DialogHeader className="bg-card shrink-0 border-b px-5 py-4 pr-12 text-left sm:px-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <DialogTitle>
                                {stage === 'done'
                                    ? 'Invoice ready'
                                    : stage === 'review'
                                      ? 'Review and issue invoice'
                                      : invoiceId
                                        ? 'Edit invoice'
                                        : 'Create invoice'}
                            </DialogTitle>
                            <Badge variant={stage === 'done' ? 'success' : 'secondary'}>
                                {stage === 'done'
                                    ? 'Issued'
                                    : stage === 'review'
                                      ? 'Final review'
                                      : saved
                                        ? 'Draft saved'
                                        : invoiceId
                                          ? 'Draft'
                                          : 'New draft'}
                            </Badge>
                        </div>
                        <DialogDescription>
                            {stage === 'done'
                                ? 'Your invoice has a permanent number and is ready to share.'
                                : stage === 'review'
                                  ? 'Check the company, customer and totals before creating a numbered invoice. Drafts stay editable until issued.'
                                  : invoiceId
                                    ? 'Update your draft, arrange its items and review before issuing.'
                                    : 'Add customer details and items, then review your invoice before issuing.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
                        {error && <BillingFeedback kind="error">{error}</BillingFeedback>}
                        {busy && (
                            <div role="status" className="text-muted-foreground flex items-center justify-center gap-3 py-12 text-sm">
                                <LoaderCircle className="size-5 animate-spin" />
                                {stage === 'review' ? 'Preparing review…' : 'Loading…'}
                            </div>
                        )}
                        {stage === 'edit' && seed && (
                            <InvoiceForm
                                {...seed}
                                embedded
                                footerTarget={footerTarget}
                                onModalStateChange={onFormState}
                                onItemDragChange={setDraggingItem}
                                onSaved={(data) => {
                                    setSeed(data);
                                    setSaved(true);
                                    toast.success('Invoice draft saved.');
                                    setDirty(false);
                                }}
                                onReview={(invoice, action) => {
                                    setSaveAction(action);
                                    void loadReview(invoice);
                                }}
                            />
                        )}
                        {stage === 'review' && !busy && (
                            <div className="space-y-5">
                                <div className="bg-muted/30 flex flex-wrap items-center gap-4 rounded-xl border p-4">
                                    <Label className="flex items-center gap-2">
                                        <Checkbox
                                            checked={refreshSeller}
                                            disabled={busy}
                                            onCheckedChange={(value) => {
                                                if (seed?.invoice) void loadReview(seed.invoice, value === true, refreshCustomer);
                                            }}
                                        />
                                        Use current company details
                                    </Label>
                                    <Label className="flex items-center gap-2">
                                        <Checkbox
                                            checked={refreshCustomer}
                                            disabled={busy}
                                            onCheckedChange={(value) => {
                                                if (seed?.invoice) void loadReview(seed.invoice, refreshSeller, value === true);
                                            }}
                                        />
                                        Refresh customer details
                                    </Label>
                                </div>
                                {review && (
                                    <>
                                        {review.errors.length > 0 ? (
                                            <BillingFeedback kind="error">
                                                <p className="font-medium">Fix these details before issuing</p>
                                                <ul className="mt-2 list-disc pl-5">
                                                    {review.errors.map((message, i) => (
                                                        <li key={i}>{message}</li>
                                                    ))}
                                                </ul>
                                            </BillingFeedback>
                                        ) : (
                                            <BillingFeedback kind="info">
                                                Ready to issue. Check the details below before creating the numbered invoice.
                                            </BillingFeedback>
                                        )}
                                        <InvoiceDocument
                                            invoice={{ ...review.invoice, seller_snapshot: review.seller, customer_snapshot: review.customer }}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                        {stage === 'done' && issued && (
                            <div className="mx-auto max-w-md space-y-4 py-12 text-center">
                                <div className="bg-primary/10 mx-auto grid size-14 place-items-center rounded-full">
                                    <Check className="text-primary size-7" />
                                </div>
                                <h2 className="text-2xl font-semibold">{issued.formatted_number}</h2>
                                <p className="text-muted-foreground">
                                    {issued.totals.total} {issued.currency} · Invoice issued
                                </p>
                                {saveAction === 'payment' && (
                                    <Button disabled={busy} onClick={() => void loadPayment(issued)}>
                                        Record payment
                                    </Button>
                                )}
                                <Button
                                    onClick={() => {
                                        onClose();
                                        router.visit(route('admin.invoices.show', issued.id));
                                    }}
                                >
                                    Open invoice
                                </Button>
                            </div>
                        )}
                    </div>
                    {stage === 'edit' && <div ref={setFooterTarget} className="bg-card shrink-0 border-t px-5 py-4 sm:px-6" />}
                    {stage !== 'edit' && (
                        <div className="bg-card flex shrink-0 flex-wrap justify-between gap-3 border-t px-5 py-4 sm:px-6">
                            <Button variant="outline" disabled={busy} onClick={() => (stage === 'done' ? void close() : setStage('edit'))}>
                                <ArrowLeft />
                                {stage === 'done' ? 'Back to invoices' : 'Back to details'}
                            </Button>
                            {stage === 'review' && (
                                <InvoiceSaveButton
                                    action={saveAction}
                                    canSend={seed?.canSend ?? false}
                                    canRecordPayment={seed?.canRecordPayment ?? false}
                                    disabled={busy || !review || review.errors.length > 0}
                                    onSave={(action) => void issue(action)}
                                />
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {open && paymentContext && (
                <InvoicePayments
                    dialogOnly
                    invoice={paymentContext.invoice}
                    settlement={paymentContext.settlement}
                    payments={null}
                    canRecord={paymentContext.canRecordPayment}
                    methods={paymentContext.paymentMethods}
                    today={paymentContext.today}
                    recordRequested={recordPayment}
                    onRecordRequested={acknowledgePaymentRequest}
                    onRecordClosed={() => void close()}
                    onRecorded={() => {
                        toast.success('Payment recorded.');
                        void close();
                    }}
                />
            )}
            {dialog}
        </>
    );
}
