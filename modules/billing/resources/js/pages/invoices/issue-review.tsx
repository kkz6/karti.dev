import { BillingPageContainer as PageContainer } from '@billing/components/billing-page-container';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Label } from '@shared/components/ui/label';
import AppLayout from '@shared/layouts/app-layout';
import axios from 'axios';
import { Receipt as BillingPageIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { BillingFeedback } from '../../components/billing-feedback';
import { InvoiceDocument } from '../../components/invoice-document';
import { InvoicePayments, type InvoicePaymentContext } from '../../components/invoice-payments';
import { InvoiceSaveButton, type InvoiceSaveAction } from '../../components/invoice-save-button';
import { useBillingConfirm } from '../../components/use-billing-confirm';
import type { InvoiceData } from '../../invoice-types';

type Review = {
    invoice: InvoiceData;
    seller: InvoiceData['seller_snapshot'];
    customer: InvoiceData['customer_snapshot'];
    errors: string[];
    token: string;
    prefix: string;
    padding: number;
};

export default function IssueReview({
    review,
    refreshSeller,
    refreshCustomer,
    canSend,
    canRecordPayment,
}: {
    review: Review;
    refreshSeller: boolean;
    refreshCustomer: boolean;
    canSend: boolean;
    canRecordPayment: boolean;
}) {
    const { url } = usePage();
    const requestedAction = new URL(url, 'http://localhost').searchParams.get('after_issue');
    const afterIssue = requestedAction === 'send' && canSend ? 'send' : requestedAction === 'payment' && canRecordPayment ? 'payment' : 'save';
    const { confirm, dialog } = useBillingConfirm();
    const [selection, setSelection] = useState({ seller: refreshSeller, customer: refreshCustomer });
    const [refreshing, setRefreshing] = useState(false);
    const [issuing, setIssuing] = useState(false);
    const [issued, setIssued] = useState<InvoiceData | null>(null);
    const [paymentContext, setPaymentContext] = useState<InvoicePaymentContext | null>(null);
    const [recordRequested, setRecordRequested] = useState(false);
    const [paymentRecorded, setPaymentRecorded] = useState(false);
    const acknowledgeRecordRequest = useCallback(() => setRecordRequested(false), []);
    const form = useForm({
        version: review.invoice.version,
        review_token: review.token,
        refresh_seller: refreshSeller,
        refresh_customer: refreshCustomer,
    });
    const refresh = (seller: boolean, customer: boolean) => {
        setSelection({ seller, customer });
        setRefreshing(true);
        router.get(
            route('admin.invoices.issue-review', review.invoice.id),
            { refresh_seller: seller ? 1 : 0, refresh_customer: customer ? 1 : 0, after_issue: afterIssue },
            {
                preserveScroll: true,
                preserveState: false,
                onError: () => setSelection({ seller: refreshSeller, customer: refreshCustomer }),
                onFinish: () => setRefreshing(false),
            },
        );
    };
    const loadPayment = async (invoice: InvoiceData) => {
        setIssuing(true);
        form.clearErrors();
        try {
            const { data } = await axios.get<InvoicePaymentContext>(route('admin.invoices.show', invoice.id), {
                headers: { Accept: 'application/json' },
            });
            if (!data.canRecordPayment || !data.settlement.can_receive || !data.paymentMethods.length) {
                form.setError(
                    'review_token',
                    'The invoice is issued, but payment entry is unavailable. Check its balance, payment permissions and enabled payment methods.',
                );
            } else {
                setPaymentContext(data);
                setRecordRequested(true);
            }
        } catch {
            form.setError('review_token', 'The invoice is issued, but payment entry could not be loaded. Retry recording the payment below.');
        } finally {
            setIssuing(false);
        }
    };
    const issue = async (action: InvoiceSaveAction) => {
        if (
            await confirm(
                action === 'send'
                    ? 'Issue this invoice? Its number and financial details will become permanent. You will review the recipients and message before sending.'
                    : action === 'payment'
                      ? 'Issue this invoice? Its number and financial details will become permanent. You will enter the payment details next; no payment is recorded yet.'
                      : 'Issue this invoice without sending? Its number and financial details will become permanent.',
            )
        ) {
            if (action === 'payment') {
                setIssuing(true);
                form.clearErrors();
                try {
                    const { data } = await axios.post(route('admin.invoices.issue', review.invoice.id), form.data, {
                        headers: { Accept: 'application/json' },
                    });
                    setIssued(data.invoice);
                    await loadPayment(data.invoice);
                } catch (error) {
                    const messages = axios.isAxiosError(error)
                        ? Object.values(error.response?.data?.errors ?? {})
                              .flat()
                              .map(String)
                        : [];
                    form.setError('review_token', messages.join(' ') || 'The invoice could not be issued. Review it before trying again.');
                } finally {
                    setIssuing(false);
                }
                return;
            }
            form.post(route('admin.invoices.issue', review.invoice.id), {
                onSuccess: () => {
                    if (action === 'send') router.visit(route('admin.invoices.show', { invoice: review.invoice.id, tab: 'send' }));
                },
            });
        }
    };
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Invoices', href: route('admin.invoices.index') },
                { title: `Draft #${review.invoice.id}`, href: route('admin.invoices.show', review.invoice.id) },
                { title: 'Review and issue', href: route('admin.invoices.issue-review', review.invoice.id) },
            ]}
        >
            {dialog}
            <Head title={issued ? 'Invoice issued' : 'Review and issue invoice'} />
            <PageContainer className="max-w-6xl space-y-6">
                <div>
                    <IndexHeader title={issued ? 'Invoice issued' : 'Review and issue invoice'} icon={BillingPageIcon} />
                    <p className="text-muted-foreground mt-2 text-sm">
                        {issued
                            ? 'The invoice has a permanent number. You can return to your invoices when you are done.'
                            : 'Check the company, customer and totals. Issuing assigns a permanent number and locks the billing details.'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-6">
                    <Label className="flex items-center gap-2">
                        <Checkbox
                            checked={selection.seller}
                            disabled={form.processing || refreshing || issuing || !!issued}
                            onCheckedChange={(checked) => refresh(checked === true, selection.customer)}
                        />
                        Use current company details
                    </Label>
                    <Label className="flex items-center gap-2">
                        <Checkbox
                            checked={selection.customer}
                            disabled={form.processing || refreshing || issuing || !!issued}
                            onCheckedChange={(checked) => refresh(selection.seller, checked === true)}
                        />
                        Use current customer billing details
                    </Label>
                </div>
                {review.errors.length > 0 && (
                    <BillingFeedback kind="error">
                        <p>Complete these details before issuing:</p>
                        {review.errors.map((error, i) => (
                            <p key={i}>{error}</p>
                        ))}
                    </BillingFeedback>
                )}
                {Object.values(form.errors).length > 0 && (
                    <BillingFeedback kind="error">
                        {Object.values(form.errors).map((error, i) => (
                            <p key={i}>{error}</p>
                        ))}
                        {!issued && (
                            <Button variant="outline" type="button" onClick={() => refresh(refreshSeller, refreshCustomer)}>
                                Reload review
                            </Button>
                        )}
                    </BillingFeedback>
                )}
                <p className="text-muted-foreground text-sm">
                    Number format example: {review.prefix}
                    {'1'.padStart(review.padding, '0')}
                </p>
                {issued && (
                    <BillingFeedback kind="info">
                        Invoice {issued.formatted_number} issued.{paymentRecorded ? ' Payment recorded.' : ''}
                    </BillingFeedback>
                )}
                <InvoiceDocument invoice={issued ?? { ...review.invoice, seller_snapshot: review.seller, customer_snapshot: review.customer }} />
                <div className="flex flex-wrap gap-3">
                    {!issued ? (
                        <InvoiceSaveButton
                            action={afterIssue}
                            canSend={canSend}
                            canRecordPayment={canRecordPayment}
                            disabled={form.processing || refreshing || issuing || review.errors.length > 0}
                            onSave={(action) => void issue(action)}
                        />
                    ) : (
                        !paymentRecorded && (
                            <Button disabled={issuing} onClick={() => void loadPayment(issued)}>
                                Record payment
                            </Button>
                        )
                    )}
                    <Button variant="outline" asChild>
                        <Link href={issued ? route('admin.invoices.index') : route('admin.invoices.edit', review.invoice.id)}>
                            {issued ? 'Back to invoices' : 'Back to draft'}
                        </Link>
                    </Button>
                </div>
                {paymentContext && (
                    <InvoicePayments
                        dialogOnly
                        invoice={paymentContext.invoice}
                        settlement={paymentContext.settlement}
                        payments={null}
                        canRecord={paymentContext.canRecordPayment}
                        methods={paymentContext.paymentMethods}
                        today={paymentContext.today}
                        recordRequested={recordRequested}
                        onRecordRequested={acknowledgeRecordRequest}
                        onRecordClosed={() => setPaymentContext(null)}
                        onRecorded={() => {
                            setPaymentRecorded(true);
                            setPaymentContext(null);
                        }}
                    />
                )}
            </PageContainer>
        </AppLayout>
    );
}
