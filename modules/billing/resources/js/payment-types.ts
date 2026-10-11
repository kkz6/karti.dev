export type Settlement = { credited: string; state: string; paid: string; balance: string; overdue: boolean; can_receive: boolean };
export type PaymentData = {
    id: number;
    amount: string;
    currency: string;
    payment_date: string;
    method_label: string;
    reference: string | null;
    notes: string | null;
    actor_name: string;
    created_at: string;
    reversed_at: string | null;
    reversed_by_name: string | null;
    reversal_reason: string | null;
    canReverse?: boolean;
    invoice_id?: number;
    invoice_number?: string;
};
export type PaymentMethod = { value: string; label: string };
export type CustomerFinancials = {
    totals: {
        currency: string;
        invoiced: string;
        credited: string;
        available_credit: string;
        net_balance: string;
        refunds: string;
        paid: string;
        balance: string;
        overdue: string;
    }[];
    invoices: { id: number; number: string; status: string; currency: string; total: string; due_date: string | null; settlement: Settlement }[];
    payments: PaymentData[] | null;
};
