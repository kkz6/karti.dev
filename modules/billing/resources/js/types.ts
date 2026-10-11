export type Contact = {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    title: string | null;
    is_primary: boolean;
    invoice_emails: boolean;
    archived_at: string | null;
};

export type Customer = {
    id: number;
    type: 'business' | 'individual';
    display_name: string;
    legal_name: string | null;
    phone: string | null;
    website: string | null;
    tax_identifier: string | null;
    billing_address: string | null;
    billing_address_line_2: string | null;
    billing_city: string | null;
    billing_state: string | null;
    billing_postal_code: string | null;
    billing_country: string | null;
    default_currency: string | null;
    internal_notes: string | null;
    archived_at: string | null;
    contacts: Contact[];
};

export type CurrencyOption = { code: string; name: string; precision: number };
export type CataloguePermissions = { update: boolean; archive: boolean; restore: boolean };
export type TaxRate = { id: number; name: string; percentage: string; archived_at: string | null };
export type BillingSettings = {
    payment_methods: string[];
    display_name: string;
    legal_name: string;
    address: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    tax_identifier: string;
    email: string;
    phone: string;
    logo_media_id: number | null;
    timezone: string;
    default_currency: string;
    due_days: number;
    number_prefix: string;
    number_padding: number;
    default_terms: string;
    payment_instructions: string;
};
