import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Label } from '@shared/components/ui/label';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { InvoiceData } from '../invoice-types';
import type { CustomerFinancials, PaymentData, PaymentMethod, Settlement } from '../payment-types';
import { BillingSelect, BillingSelectItem } from './billing-select';
import { InvoiceCreditNotes, type CreditData } from './invoice-credit-notes';
import { InvoicePayments } from './invoice-payments';

type Details = {
    invoice: InvoiceData;
    settlement: Settlement;
    payments: PaymentData[] | null;
    paymentMethods: PaymentMethod[];
    today: string;
    canRecordPayment: boolean;
    canCreateCredit: boolean;
    credits: CreditData[] | null;
};
export function CustomerFinancialActions({
    customerId,
    invoices,
    action,
    onClose,
}: {
    customerId: number;
    invoices: CustomerFinancials['invoices'];
    action: 'payment' | 'credit';
    onClose: () => void;
}) {
    const eligible = invoices.filter((invoice) => invoice.status === 'issued' && (action === 'credit' || invoice.settlement.can_receive));
    const [selected, setSelected] = useState('');
    const [details, setDetails] = useState<Details | null>(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setDetails(null);
        if (!selected) return;
        const abort = new AbortController();
        setLoading(true);
        axios
            .get(route('admin.invoices.show', selected), { signal: abort.signal, headers: { Accept: 'application/json' } })
            .then(({ data }) => setDetails(data))
            .catch((error) => {
                if (!axios.isCancel(error)) toast.error('The invoice could not be loaded. Try again.');
            })
            .finally(() => {
                if (!abort.signal.aborted) setLoading(false);
            });
        return () => abort.abort();
    }, [selected]);
    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{action === 'payment' ? 'Record payment' : 'Create credit note'}</DialogTitle>
                    <DialogDescription>Select an invoice belonging to this customer. The customer cannot be changed.</DialogDescription>
                </DialogHeader>
                {eligible.length ? (
                    <div className="space-y-2">
                        <Label htmlFor="customer-action-invoice">Invoice</Label>
                        <BillingSelect id="customer-action-invoice" value={selected} onValueChange={setSelected}>
                            {eligible.map((invoice) => (
                                <BillingSelectItem key={invoice.id} value={invoice.id}>
                                    {invoice.number} · {invoice.currency} {invoice.total}
                                </BillingSelectItem>
                            ))}
                        </BillingSelect>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-sm">
                        {action === 'payment'
                            ? 'There are no issued invoices with an outstanding balance.'
                            : 'Issue an invoice for this customer before creating a credit note.'}
                    </p>
                )}
                {loading && (
                    <p role="status" className="text-muted-foreground text-sm">
                        Loading invoice…
                    </p>
                )}
                {details &&
                    (action === 'payment' ? (
                        <InvoicePayments
                            embedded
                            invoice={details.invoice}
                            settlement={details.settlement}
                            payments={details.payments}
                            methods={details.paymentMethods}
                            today={details.today}
                            canRecord={details.canRecordPayment}
                            customerContext={customerId}
                            onRecorded={onClose}
                        />
                    ) : (
                        <InvoiceCreditNotes
                            embedded
                            invoiceId={details.invoice.id}
                            currency={details.invoice.currency}
                            today={details.today}
                            canCreate={details.canCreateCredit}
                            credits={details.credits}
                        />
                    ))}
            </DialogContent>
        </Dialog>
    );
}
