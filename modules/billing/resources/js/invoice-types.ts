export type InvoiceTax = { tax_rate_id: number | null; name: string; percentage: string };
export type InvoiceLine = {
    key: string;
    service_id: number | null;
    description: string;
    additional_description: string;
    unit: string;
    quantity: string;
    rate: string;
    taxes: InvoiceTax[];
};
export type InvoiceFormData = {
    customer_id: string;
    version: number | null;
    invoice_date: string;
    due_date: string;
    currency: string;
    discount_mode: 'none' | 'fixed' | 'percent';
    discount_value: string;
    customer_note: string;
    internal_note: string;
    terms: string;
    payment_instructions: string;
    refresh_customer: boolean;
    items: InvoiceLine[];
};
export type InvoiceTotals = {
    currency: string;
    precision: number;
    subtotal: string;
    discount: string;
    tax: string;
    total: string;
    lines: { key: string; gross: string; discount: string; net: string; tax: string; total: string }[];
    tax_groups: { name: string; percentage: string; amount: string }[];
};
export type CustomerChoice = { id: number; display_name: string; default_currency: string | null; archived_at: string | null };
export type InvoiceData = Omit<InvoiceFormData, 'customer_id' | 'refresh_customer'> & {
    id: number;
    customer_id: number;
    version: number;
    status: string;
    formatted_number: string | null;
    issued_at?: string | null;
    cancelled_at?: string | null;
    cancellation_reason?: string | null;
    totals: InvoiceTotals;
    customer_snapshot: { display_name: string; legal_name?: string; billing_address?: string; billing_city?: string; billing_country?: string };
    seller_snapshot: { display_name: string; legal_name: string };
};

export function blankLine(): InvoiceLine {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const key = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
    return { key, service_id: null, description: '', additional_description: '', unit: 'item', quantity: '1', rate: '', taxes: [] };
}

export function editableInvoice(invoice: InvoiceData): InvoiceFormData {
    return {
        customer_id: String(invoice.customer_id),
        version: invoice.version,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date ?? '',
        currency: invoice.currency,
        discount_mode: invoice.discount_mode,
        discount_value: invoice.discount_value,
        customer_note: invoice.customer_note ?? '',
        internal_note: invoice.internal_note ?? '',
        terms: invoice.terms ?? '',
        payment_instructions: invoice.payment_instructions ?? '',
        refresh_customer: false,
        items: invoice.items.map((line) => ({ ...line, additional_description: line.additional_description ?? '' })),
    };
}
