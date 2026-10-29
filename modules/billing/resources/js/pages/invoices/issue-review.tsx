import { BillingPageContainer as PageContainer } from '@billing/components/billing-page-container';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Label } from '@shared/components/ui/label';
import AppLayout from '@shared/layouts/app-layout';
import { Receipt as BillingPageIcon } from 'lucide-react';
import { useState } from 'react';
import { BillingFeedback } from '../../components/billing-feedback';
import { InvoiceDocument } from '../../components/invoice-document';
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
    const issue = async (action: InvoiceSaveAction) => {
        if (
            await confirm(
                action === 'send'
                    ? 'Issue this invoice? Its number and financial details will become permanent. You will review the recipients and message before sending.'
                    : action === 'payment'
                      ? 'Issue this invoice? Its number and financial details will become permanent. You will enter the payment details next; no payment is recorded yet.'
                      : 'Issue this invoice without sending? Its number and financial details will become permanent.',
            )
        )
            form.post(route('admin.invoices.issue', review.invoice.id), {
                onSuccess: () => {
                    if (action !== 'save')
                        router.visit(
                            route('admin.invoices.show', { invoice: review.invoice.id, tab: action === 'send' ? 'send' : 'record-payment' }),
                        );
                },
            });
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
            <Head title="Review and issue invoice" />
            <PageContainer className="max-w-6xl space-y-6">
                <div>
                    <IndexHeader title={'Review and issue invoice'} icon={BillingPageIcon} />
                    <p className="text-muted-foreground mt-2 text-sm">
                        Check the company, customer and totals. Issuing assigns a permanent number and locks the billing details.
                    </p>
                </div>
                <div className="flex flex-wrap gap-6">
                    <Label className="flex items-center gap-2">
                        <Checkbox
                            checked={selection.seller}
                            disabled={form.processing || refreshing}
                            onCheckedChange={(checked) => refresh(checked === true, selection.customer)}
                        />
                        Use current company details
                    </Label>
                    <Label className="flex items-center gap-2">
                        <Checkbox
                            checked={selection.customer}
                            disabled={form.processing || refreshing}
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
                        <Button variant="outline" type="button" onClick={() => refresh(refreshSeller, refreshCustomer)}>
                            Reload review
                        </Button>
                    </BillingFeedback>
                )}
                <p className="text-muted-foreground text-sm">
                    Number format example: {review.prefix}
                    {'1'.padStart(review.padding, '0')}
                </p>
                <InvoiceDocument invoice={{ ...review.invoice, seller_snapshot: review.seller, customer_snapshot: review.customer }} />
                <div className="flex flex-wrap gap-3">
                    <InvoiceSaveButton
                        action={afterIssue}
                        canSend={canSend}
                        canRecordPayment={canRecordPayment}
                        disabled={form.processing || refreshing || review.errors.length > 0}
                        onSave={(action) => void issue(action)}
                    />
                    <Button variant="outline" asChild>
                        <Link href={route('admin.invoices.edit', review.invoice.id)}>Back to draft</Link>
                    </Button>
                </div>
            </PageContainer>
        </AppLayout>
    );
}
