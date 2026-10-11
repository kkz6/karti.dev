import { Head, Link, useForm } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { continueWithoutUnsavedChangesPrompt, UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import { Users as BillingPageIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { BillingFormCanvas, BillingFormFrame, useBillingModalForm } from '../../components/billing-create-modal';
import { BillingFeedback } from '../../components/billing-feedback';
import { BillingSelect, BillingSelectItem } from '../../components/billing-select';
import type { CurrencyOption, Customer } from '../../types';

const fields = [
    ['display_name', 'Customer name', 'text', 'The name you use to identify this customer.'],
    ['legal_name', 'Legal name', 'text', 'Optional registered business name.'],
    ['phone', 'Phone', 'tel', ''],
    ['website', 'Website', 'url', ''],
    ['tax_identifier', 'Tax identifier', 'text', 'Optional tax or registration number.'],
    ['default_currency', 'Default currency', 'text', 'Used automatically on new invoices for this customer.'],
    ['billing_address', 'Billing address', 'text', ''],
    ['billing_address_line_2', 'Address line 2', 'text', ''],
    ['billing_city', 'City', 'text', ''],
    ['billing_state', 'State or region', 'text', ''],
    ['billing_postal_code', 'Postal code', 'text', ''],
    ['billing_country', 'Country code', 'text', 'Two-letter code, such as IN or US.'],
] as const;

export default function CustomerForm({ customer, currencies = [] }: { customer?: Customer; currencies?: CurrencyOption[] }) {
    const initial = {
        type: customer?.type ?? 'business',
        display_name: customer?.display_name ?? '',
        legal_name: customer?.legal_name ?? '',
        phone: customer?.phone ?? '',
        website: customer?.website ?? '',
        tax_identifier: customer?.tax_identifier ?? '',
        default_currency: customer?.default_currency ?? '',
        billing_address: customer?.billing_address ?? '',
        billing_address_line_2: customer?.billing_address_line_2 ?? '',
        billing_city: customer?.billing_city ?? '',
        billing_state: customer?.billing_state ?? '',
        billing_postal_code: customer?.billing_postal_code ?? '',
        billing_country: customer?.billing_country ?? '',
        internal_notes: customer?.internal_notes ?? '',
    };
    const form = useForm(initial);
    const modal = useBillingModalForm(form);
    const title = customer ? 'Edit customer' : 'Add customer';
    const back = customer ? route('admin.customers.show', customer.id) : route('admin.customers.index');
    const submit = (event: FormEvent) => {
        event.preventDefault();
        continueWithoutUnsavedChangesPrompt(() =>
            customer ? form.patch(route('admin.customers.update', customer.id)) : form.post(route('admin.customers.store'), modal?.visitOptions),
        );
    };
    return (
        <BillingFormFrame
            breadcrumbs={[
                { title: 'Customers', href: route('admin.customers.index') },
                { title, href: back },
            ]}
        >
            {!modal && <Head title={title} />}
            <UnsavedChangesGuard dirty={form.isDirty && !form.processing} />
            <BillingFormCanvas className="max-w-4xl space-y-7">
                {!modal && (
                    <div>
                        <IndexHeader title={title} icon={BillingPageIcon} />
                        <p className="text-muted-foreground mt-2 text-sm">Save the customer, then add their billing contacts.</p>
                    </div>
                )}
                <form onSubmit={submit} className={modal ? 'space-y-5' : 'bg-card max-w-4xl space-y-6 rounded-xl border p-5 sm:p-6'}>
                    {Object.keys(form.errors).length > 0 && <BillingFeedback kind="error">Please correct the highlighted fields.</BillingFeedback>}
                    <div className="space-y-2">
                        <Label htmlFor="type">Customer type</Label>
                        <BillingSelect
                            id="type"
                            value={form.data.type}
                            onValueChange={(value) => form.setData('type', value as Customer['type'])}
                            disabled={form.processing}
                        >
                            <BillingSelectItem value="business">Business</BillingSelectItem>
                            <BillingSelectItem value="individual">Individual</BillingSelectItem>
                        </BillingSelect>
                        {form.errors.type && <p className="text-destructive text-sm">{form.errors.type}</p>}
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        {fields.map(([key, label, type, hint]) => (
                            <div key={key} className="space-y-2">
                                <Label htmlFor={key}>
                                    {label}
                                    {key === 'display_name' ? ' *' : ''}
                                </Label>
                                {key === 'default_currency' ? (
                                    <BillingSelect
                                        id={key}
                                        value={form.data.default_currency || 'company'}
                                        onValueChange={(value) => form.setData('default_currency', value === 'company' ? '' : value)}
                                    >
                                        <BillingSelectItem value="company">Use company default</BillingSelectItem>
                                        {currencies.map((currency) => (
                                            <BillingSelectItem key={currency.code} value={currency.code}>
                                                {currency.code} — {currency.name}
                                            </BillingSelectItem>
                                        ))}
                                    </BillingSelect>
                                ) : (
                                    <Input
                                        id={key}
                                        type={type}
                                        value={form.data[key]}
                                        onChange={(e) => form.setData(key, e.target.value)}
                                        required={key === 'display_name'}
                                        maxLength={key === 'billing_country' ? 2 : undefined}
                                        aria-invalid={!!form.errors[key]}
                                        aria-describedby={form.errors[key] ? `${key}-error` : undefined}
                                    />
                                )}
                                {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
                                {form.errors[key] && (
                                    <p id={`${key}-error`} className="text-destructive text-sm">
                                        {form.errors[key]}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="internal_notes">Internal notes</Label>
                        <Textarea
                            id="internal_notes"
                            value={form.data.internal_notes}
                            onChange={(e) => form.setData('internal_notes', e.target.value)}
                            rows={4}
                        />
                        <p className="text-muted-foreground text-xs">Private notes for your team.</p>
                        {form.errors.internal_notes && <p className="text-destructive text-sm">{form.errors.internal_notes}</p>}
                    </div>
                    <div className="flex gap-3">
                        <Button disabled={form.processing} type="submit">
                            {form.processing ? 'Saving…' : 'Save customer'}
                        </Button>
                        {modal ? (
                            <Button type="button" variant="outline" onClick={() => void modal.requestClose()}>
                                Cancel
                            </Button>
                        ) : (
                            <Button variant="outline" asChild>
                                <Link href={back}>Cancel</Link>
                            </Button>
                        )}
                    </div>
                </form>
            </BillingFormCanvas>
        </BillingFormFrame>
    );
}
