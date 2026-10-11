import { BillingPageContainer as PageContainer } from '@billing/components/billing-page-container';
import { Head, Link, router } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card } from '@shared/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import AppLayout from '@shared/layouts/app-layout';
import { Archive, Users as BillingPageIcon, Mail, Pencil, Plus, RotateCcw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { BillingFeedback } from '../../components/billing-feedback';
import { ContactForm } from '../../components/contact-form';
import { CustomerFinancials } from '../../components/customer-financials';
import { useBillingConfirm } from '../../components/use-billing-confirm';
import type { CustomerFinancials as Financials } from '../../payment-types';
import type { Contact, Customer } from '../../types';

export default function CustomerDetail({
    canStatement,
    customer,
    financials,
    can,
    message,
}: {
    canStatement: boolean;
    customer: Customer;
    financials: Financials | null;
    can: { update: boolean; archive: boolean; restore: boolean };
    message?: string;
}) {
    const { confirm, dialog } = useBillingConfirm();

    const [editing, setEditing] = useState<Contact | 'new' | null>(null);
    const [contactDirty, setContactDirty] = useState(false),
        [contactBusy, setContactBusy] = useState(false);
    const contactState = useCallback((dirty: boolean, busy: boolean) => {
        setContactDirty(dirty);
        setContactBusy(busy);
    }, []);
    const closeContact = async () => {
        if (contactBusy) return;
        if (contactDirty && !(await confirm('Discard your unsaved contact changes?'))) return;
        setEditing(null);
    };
    const archived = !!customer.archived_at;
    const archiveCustomer = async () => {
        if (await confirm(archived ? 'Restore this customer?' : 'Archive this customer? Their details and contacts will be preserved.')) {
            router.post(route(archived ? 'admin.customers.restore' : 'admin.customers.archive', customer.id), {}, { preserveScroll: true });
        }
    };
    const toggleContact = async (contact: Contact) => {
        if (
            await confirm(
                contact.archived_at ? 'Restore this contact?' : 'Archive this contact? Another active contact will become primary if needed.',
            )
        ) {
            router.post(
                route(contact.archived_at ? 'admin.customers.contacts.restore' : 'admin.customers.contacts.archive', [customer.id, contact.id]),
                {},
                { preserveScroll: true },
            );
        }
    };
    const address = [
        customer.billing_address,
        customer.billing_address_line_2,
        customer.billing_city,
        customer.billing_state,
        customer.billing_postal_code,
        customer.billing_country,
    ].filter(Boolean);
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Customers', href: route('admin.customers.index') },
                { title: customer.display_name, href: route('admin.customers.show', customer.id) },
            ]}
        >
            {dialog}
            <Head title={customer.display_name} />
            <PageContainer className="max-w-5xl space-y-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <IndexHeader title={customer.display_name} icon={BillingPageIcon} />
                            <Badge variant="secondary">{archived ? 'Archived' : customer.type === 'business' ? 'Business' : 'Individual'}</Badge>
                        </div>
                        {customer.legal_name && <p className="text-muted-foreground mt-2">{customer.legal_name}</p>}
                    </div>
                    <div className="flex gap-2">
                        {can.update && !archived && (
                            <Button variant="outline" asChild>
                                <Link href={route('admin.customers.edit', customer.id)}>
                                    <Pencil className="size-4" />
                                    Edit customer
                                </Link>
                            </Button>
                        )}
                        {(archived ? can.restore : can.archive) && (
                            <Button variant="outline" onClick={archiveCustomer} disabled={editing !== null}>
                                {archived ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}
                                {archived ? 'Restore' : 'Archive'}
                            </Button>
                        )}
                    </div>
                </div>
                {message && <BillingFeedback kind="success">{message}</BillingFeedback>}
                {archived && <BillingFeedback>This customer is archived. Restore them to edit their details or manage contacts.</BillingFeedback>}
                <section className="grid gap-6 border-y py-6 sm:grid-cols-2">
                    <div>
                        <h2 className="mb-3 font-semibold">Billing details</h2>
                        {address.length ? (
                            <address className="text-muted-foreground text-sm leading-6 not-italic">
                                {address.map((line, i) => (
                                    <div key={i}>{line}</div>
                                ))}
                            </address>
                        ) : (
                            <p className="text-muted-foreground text-sm">No billing address added.</p>
                        )}
                        <dl className="mt-4 space-y-2 text-sm">
                            <div>
                                <dt className="text-muted-foreground inline">Tax identifier: </dt>
                                <dd className="inline">{customer.tax_identifier || 'Not added'}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground inline">Default currency: </dt>
                                <dd className="inline">{customer.default_currency || 'Not set'}</dd>
                            </div>
                        </dl>
                    </div>
                    <div>
                        <h2 className="mb-3 font-semibold">Customer details</h2>
                        <p className="text-sm">{customer.phone || 'No phone added'}</p>
                        {customer.website && (
                            <a
                                href={customer.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary mt-2 block text-sm break-all underline"
                            >
                                {customer.website}
                            </a>
                        )}
                        {customer.internal_notes && (
                            <div className="mt-5">
                                <h3 className="text-muted-foreground mb-2 text-xs font-medium">Internal notes</h3>
                                <p className="text-sm whitespace-pre-wrap">{customer.internal_notes}</p>
                            </div>
                        )}
                    </div>
                </section>
                <section className="space-y-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Billing contacts</h2>
                        {can.update && !archived && (
                            <Button variant="outline" onClick={() => setEditing('new')} disabled={editing !== null}>
                                <Plus className="size-4" />
                                Add contact
                            </Button>
                        )}
                    </div>
                    <Dialog
                        open={editing !== null}
                        onOpenChange={(open) => {
                            if (!open) void closeContact();
                        }}
                    >
                        <DialogContent onInteractOutside={(event) => event.preventDefault()}>
                            <DialogHeader>
                                <DialogTitle>{editing === 'new' ? 'Add contact' : 'Edit contact'}</DialogTitle>
                                <DialogDescription>Manage this customer’s billing contact details.</DialogDescription>
                            </DialogHeader>
                            {editing !== null && (
                                <ContactForm
                                    embedded
                                    onStateChange={contactState}
                                    key={editing === 'new' ? 'new' : editing.id}
                                    customerId={customer.id}
                                    contact={editing === 'new' ? undefined : editing}
                                    onClose={() => setEditing(null)}
                                />
                            )}
                        </DialogContent>
                    </Dialog>
                    {customer.contacts.length === 0 ? (
                        <BillingFeedback>No contacts yet. Add the person who should receive invoices.</BillingFeedback>
                    ) : (
                        <Card className="divide-y">
                            {customer.contacts.map((contact) => (
                                <div key={contact.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
                                    <div className={contact.archived_at ? 'opacity-60' : ''}>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-medium">{contact.name}</h3>
                                            {contact.is_primary && <Badge variant="secondary">Primary</Badge>}
                                            {contact.archived_at && <Badge variant="outline">Archived</Badge>}
                                        </div>
                                        {contact.title && <p className="text-muted-foreground mt-1 text-xs">{contact.title}</p>}
                                        <a href={`mailto:${contact.email}`} className="mt-2 flex items-center gap-2 text-sm break-all">
                                            <Mail className="size-4 shrink-0" />
                                            {contact.email}
                                        </a>
                                        {contact.phone && <p className="mt-1 text-sm">{contact.phone}</p>}
                                        <p className="text-muted-foreground mt-2 text-xs">
                                            {contact.invoice_emails ? 'Receives invoice emails' : 'Invoice emails disabled'}
                                        </p>
                                    </div>
                                    {can.update && !archived && (
                                        <div className="flex gap-2">
                                            {!contact.archived_at && (
                                                <Button variant="ghost" size="sm" onClick={() => setEditing(contact)} disabled={editing !== null}>
                                                    Edit
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => toggleContact(contact)} disabled={editing !== null}>
                                                {contact.archived_at ? 'Restore' : 'Archive'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </Card>
                    )}
                </section>
                {canStatement && (
                    <Button variant="outline" asChild>
                        <Link href={route('admin.customers.statement', customer.id)}>Account statement</Link>
                    </Button>
                )}
                {financials && <CustomerFinancials financials={financials} />}
            </PageContainer>
        </AppLayout>
    );
}
