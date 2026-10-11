import { router } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Label } from '@shared/components/ui/label';
import axios from 'axios';
import { ArrowLeft, Check, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { InvoiceData } from '../invoice-types';
import InvoiceForm, { type InvoiceFormSeed } from '../pages/invoices/form';
import { BillingFeedback } from './billing-feedback';
import { InvoiceDocument } from './invoice-document';
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
export function InvoiceComposer({ open, onClose, invoiceId }: { open: boolean; onClose: () => void; invoiceId?: number }) {
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
    const { confirm, dialog } = useBillingConfirm();
    const onFormState = useCallback((isDirty: boolean, isBusy: boolean) => {
        setDirty(isDirty);
        setFormBusy(isBusy);
    }, []);
    useEffect(() => {
        if (!open) return;
        const abort = new AbortController();
        setSeed(null);
        setReview(null);
        setStage('edit');
        setError('');
        setDirty(false);
        setSaved(false);
        setIssued(null);
        setRefreshSeller(true);
        setRefreshCustomer(false);
        setBusy(true);
        axios
            .get(invoiceId ? route('admin.invoices.edit', invoiceId) : route('admin.invoices.create'), {
                signal: abort.signal,
                headers: { Accept: 'application/json' },
            })
            .then(({ data }) => setSeed(data))
            .catch((e) => {
                if (!axios.isCancel(e)) setError('The invoice editor could not be loaded. Close and try again.');
            })
            .finally(() => {
                if (!abort.signal.aborted) setBusy(false);
            });
        return () => abort.abort();
    }, [open, invoiceId]);
    const close = async () => {
        if (busy || formBusy) return;
        if (dirty && !(await confirm('Discard your unsaved invoice changes? Saved draft details will be kept.'))) return;
        if (saved || issued) {
            setBusy(true);
            router.reload({
                only: ['table', 'selectedInvoice'],
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
            setError('Verification could not be loaded. Your saved draft is safe. Return to details and try again.');
        } finally {
            setBusy(false);
        }
    };
    const issue = async () => {
        if (!review || busy || review.errors.length) return;
        if (!(await confirm('Issue this verified invoice? Its number and financial details will become permanent.'))) return;
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
        } catch (e) {
            const details = axios.isAxiosError(e)
                ? Object.values(e.response?.data?.errors ?? {})
                      .flat()
                      .map(String)
                : [];
            setError(details.length ? details.join(' ') : 'The invoice could not be issued. Recheck verification before trying again.');
        } finally {
            setBusy(false);
        }
    };
    return (
        <>
            <Dialog
                open={open}
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
                        void close();
                    }}
                >
                    <DialogHeader className="bg-card shrink-0 border-b px-5 py-4 pr-12 text-left sm:px-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <DialogTitle>
                                {stage === 'done'
                                    ? 'Invoice ready'
                                    : stage === 'review'
                                      ? 'Verify your invoice'
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
                                  ? 'Check the billing identities, line items and exact totals before issuing.'
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
                                {stage === 'review' ? 'Verifying invoice…' : 'Loading…'}
                            </div>
                        )}
                        {stage === 'edit' && seed && (
                            <InvoiceForm
                                {...seed}
                                embedded
                                footerTarget={footerTarget}
                                onModalStateChange={onFormState}
                                onSaved={(data) => {
                                    setSeed(data);
                                    setSaved(true);
                                    setDirty(false);
                                }}
                                onReview={(invoice) => void loadReview(invoice)}
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
                                            <BillingFeedback kind="success">
                                                Verification passed. The identities and exact totals are ready for issuance.
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
                                <Button disabled={busy || !review || review.errors.length > 0} onClick={() => void issue()}>
                                    <ShieldCheck />
                                    Issue invoice
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            {dialog}
        </>
    );
}
