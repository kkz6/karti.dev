import { Head, Link, router, usePage } from '@inertiajs/react';
import { PageContainer } from '@shared/components/page-container';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@shared/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/components/ui/tooltip';
import AppLayout from '@shared/layouts/app-layout';
import { formatPhoneDisplay } from '@shared/lib/phone-number';
import { cn } from '@shared/lib/utils';
import { Archive, Building2, Ellipsis, FileText, Mail, Pencil, Phone, Plus, RotateCcw, StickyNote, Users, Wallet } from 'lucide-react';
import { useCallback, useState } from 'react';
import { BillingFeedback } from '../../components/billing-feedback';
import { ContactForm } from '../../components/contact-form';
import { CustomerFinancialActions } from '../../components/customer-financial-actions';
import { CustomerInvoiceTable } from '../../components/customer-financials';
import { CustomerStats } from '../../components/customer-stats';
import { AsideCard, Detail, DetailHeader, DetailTabs, initialTab } from '../../components/detail-page';
import { InvoiceComposer } from '../../components/invoice-composer';
import { PaymentHistory } from '../../components/invoice-payments';
import { useBillingConfirm } from '../../components/use-billing-confirm';
import type { CustomerFinancials as Financials } from '../../payment-types';
import type { Contact, Customer } from '../../types';

export default function CustomerDetail({
    canStatement,
    customer,
    financials,
    can,
}: {
    canStatement: boolean;
    customer: Customer;
    financials: Financials | null;
    can: { update: boolean; archive: boolean; restore: boolean; createInvoice?: boolean; createCredit?: boolean; recordPayment?: boolean };
    message?: string;
}) {
    const { url } = usePage();
    const { confirm, dialog } = useBillingConfirm();
    const [tab, setTab] = useState(initialTab(url, ['contacts', 'invoices', 'payments']));

    const [composing, setComposing] = useState(false);
    const [financialAction, setFinancialAction] = useState<'payment' | 'credit' | null>(null);
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
    const canEditContacts = can.update && !archived;
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
    const primary = customer.contacts.find((contact) => contact.is_primary && !contact.archived_at);
    const activeContacts = customer.contacts.filter((contact) => !contact.archived_at).length;
    const lead = financials?.totals[0];

    const badges = (
        <>
            <Badge variant="muted">{customer.type === 'business' ? 'Business' : 'Individual'}</Badge>
            {archived && <Badge variant="outline">Archived</Badge>}
        </>
    );
    const editAction = (size: 'sm' | 'default') =>
        can.update && !archived ? (
            <Button asChild size={size} variant="outline">
                <Link href={route('admin.customers.edit', customer.id)}>
                    <Pencil className="size-4" />
                    Edit customer
                </Link>
            </Button>
        ) : archived && can.restore ? (
            <Button size={size} onClick={archiveCustomer}>
                <RotateCcw className="size-4" />
                Restore
            </Button>
        ) : null;
    const primaryAction = (size: 'sm' | 'default') => (
        <>
            {can.createInvoice && (
                <Button size={size} onClick={() => setComposing(true)}>
                    <Plus className="size-4" />
                    Create invoice
                </Button>
            )}
            {editAction(size)}
        </>
    );
    const showMenu = canStatement || can.recordPayment || can.createCredit || (!archived && can.archive);
    const moreActions = showMenu && (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More actions">
                    <Ellipsis className="size-5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {can.recordPayment && (
                    <DropdownMenuItem onSelect={() => setFinancialAction('payment')}>
                        <Wallet />
                        Record payment
                    </DropdownMenuItem>
                )}
                {can.createCredit && (
                    <DropdownMenuItem onSelect={() => setFinancialAction('credit')}>
                        <FileText />
                        Create credit note
                    </DropdownMenuItem>
                )}
                {canStatement && (
                    <DropdownMenuItem asChild>
                        <Link href={route('admin.customers.statement', customer.id)}>
                            <FileText />
                            Account statement
                        </Link>
                    </DropdownMenuItem>
                )}
                {!archived && can.archive && (
                    <>
                        {canStatement && <DropdownMenuSeparator />}
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={archiveCustomer} disabled={editing !== null}>
                            <Archive />
                            Archive customer
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const contactsPanel = (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-[0.9375rem] font-semibold">Billing contacts</h2>
                    <p className="text-muted-foreground mt-1 text-xs">People who receive invoices and reminders.</p>
                </div>
                {canEditContacts && (
                    <Button variant="outline" size="sm" onClick={() => setEditing('new')} disabled={editing !== null}>
                        <Plus className="size-4" />
                        Add contact
                    </Button>
                )}
            </div>
            {customer.contacts.length === 0 ? (
                <div className="flex items-start gap-3 rounded-lg border border-dashed px-4 py-5">
                    <Users className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden="true" />
                    <div>
                        <p className="text-sm font-medium">No contacts yet</p>
                        <p className="text-muted-foreground mt-1 text-sm">Add the person who should receive invoices.</p>
                    </div>
                </div>
            ) : (
                <ul className="divide-y border-t">
                    {customer.contacts.map((contact) => (
                        <li key={contact.id} className="flex items-start gap-3 py-4 last:pb-0">
                            <div
                                className="text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-medium"
                                aria-hidden="true"
                            >
                                {contact.name
                                    .trim()
                                    .split(/\s+/)
                                    .slice(0, 2)
                                    .map((part) => part[0])
                                    .join('')
                                    .toUpperCase()}
                            </div>
                            <div className={cn('min-w-0 flex-1', contact.archived_at && 'text-muted-foreground')}>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-medium">{contact.name}</h3>
                                    {contact.is_primary && <Badge variant="info">Primary</Badge>}
                                    {contact.archived_at && <Badge variant="outline">Archived</Badge>}
                                </div>
                                {contact.title && <p className="text-muted-foreground mt-0.5 text-xs">{contact.title}</p>}
                                <div className="text-muted-foreground mt-1.5 flex flex-col gap-1.5 text-xs sm:flex-row sm:flex-wrap sm:gap-x-4">
                                    <a href={`mailto:${contact.email}`} className="hover:text-foreground inline-flex items-center gap-1.5 break-all">
                                        <Mail className="size-3.5 shrink-0" />
                                        {contact.email}
                                    </a>
                                    {contact.phone && (
                                        <a href={`tel:${contact.phone}`} className="hover:text-foreground inline-flex items-center gap-1.5">
                                            <Phone className="size-3.5 shrink-0" />
                                            {formatPhoneDisplay(contact.phone, customer.billing_country)}
                                        </a>
                                    )}
                                </div>
                                <p className="text-muted-foreground mt-2 text-xs">
                                    <span
                                        className={cn(
                                            'mr-1.5 inline-block size-1.5 rounded-full',
                                            contact.invoice_emails && !contact.archived_at ? 'bg-emerald-500' : 'bg-muted-foreground/50',
                                        )}
                                        aria-hidden="true"
                                    />
                                    {contact.archived_at
                                        ? 'Contact archived'
                                        : contact.invoice_emails
                                          ? 'Billing notifications enabled'
                                          : 'Billing notifications disabled'}
                                </p>
                            </div>
                            {canEditContacts && (
                                <div className="flex shrink-0 gap-1">
                                    {!contact.archived_at && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-7"
                                                    aria-label={`Edit ${contact.name}`}
                                                    onClick={() => setEditing(contact)}
                                                    disabled={editing !== null}
                                                >
                                                    <Pencil className="size-3.5" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Edit contact</TooltipContent>
                                        </Tooltip>
                                    )}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground size-7"
                                                aria-label={`${contact.archived_at ? 'Restore' : 'Archive'} ${contact.name}`}
                                                onClick={() => toggleContact(contact)}
                                                disabled={editing !== null}
                                            >
                                                {contact.archived_at ? <RotateCcw className="size-3.5" /> : <Archive className="size-3.5" />}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{contact.archived_at ? 'Restore contact' : 'Archive contact'}</TooltipContent>
                                    </Tooltip>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Customers', href: route('admin.customers.index') },
                { title: customer.display_name, href: route('admin.customers.show', customer.id) },
            ]}
        >
            <InvoiceComposer open={composing} onClose={() => setComposing(false)} customerId={customer.id} reloadOnly={null} />
            {financialAction && (
                <CustomerFinancialActions
                    customerId={customer.id}
                    action={financialAction}
                    invoices={financials?.invoices ?? []}
                    onClose={() => setFinancialAction(null)}
                />
            )}
            {dialog}
            <Head title={customer.display_name} />

            <PageContainer className="content-editor">
                <DetailHeader
                    stickyMeta={
                        lead && (
                            <>
                                <span className="text-muted-foreground">Balance </span>
                                <span className="font-semibold">
                                    {lead.net_balance} {lead.currency}
                                </span>
                            </>
                        )
                    }
                    stickyActions={primaryAction('sm')}
                    title={customer.display_name}
                    badges={badges}
                    subtitle={
                        [customer.legal_name !== customer.display_name && customer.legal_name, primary?.email].filter(Boolean).join(' · ') ||
                        undefined
                    }
                    actions={
                        <>
                            {moreActions}
                            {primaryAction('default')}
                        </>
                    }
                />
                <div className="space-y-4 empty:hidden">
                    {archived && <BillingFeedback>This customer is archived. Restore them to edit their details or manage contacts.</BillingFeedback>}
                </div>
                {financials && <CustomerStats financials={financials} defaultCurrency={customer.default_currency} />}
                <DetailTabs
                    label="Customer"
                    value={tab}
                    onValueChange={setTab}
                    tabs={[
                        { value: 'contacts', label: 'Contacts', count: activeContacts, content: contactsPanel },
                        ...(financials
                            ? [
                                  {
                                      value: 'invoices',
                                      label: 'Invoices',
                                      count: financials.invoices.length,
                                      content: (
                                          <section className="space-y-4">
                                              <h2 className="text-[0.9375rem] font-semibold">Invoice history</h2>
                                              <CustomerInvoiceTable invoices={financials.invoices} />
                                          </section>
                                      ),
                                  },
                              ]
                            : []),
                        ...(financials?.payments
                            ? [
                                  {
                                      value: 'payments',
                                      label: 'Payments',
                                      count: financials.payments.length,
                                      content: (
                                          <PaymentHistory
                                              embedded
                                              payments={financials.payments}
                                              emptyDescription="Payments received from this customer will appear here."
                                          />
                                      ),
                                  },
                              ]
                            : []),
                    ]}
                    aside={
                        <>
                            {financials && (
                                <AsideCard
                                    title="Account balance"
                                    icon={Wallet}
                                    description="Issued invoices and active payments; drafts and cancelled invoices are excluded."
                                >
                                    {financials.totals.length === 0 ? (
                                        <p className="text-muted-foreground text-sm">Balances appear after the first invoice is issued.</p>
                                    ) : (
                                        financials.totals.map((total, index) => (
                                            <div key={total.currency} className={cn(index > 0 && 'border-t pt-3')}>
                                                <p className="text-muted-foreground text-xs">Net balance · {total.currency}</p>
                                                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                                                    {total.net_balance}{' '}
                                                    <span className="text-muted-foreground text-xs font-normal">{total.currency}</span>
                                                </p>
                                                <dl className="mt-3 space-y-2 border-t pt-3 text-sm">
                                                    <Detail label="Invoiced">{total.invoiced}</Detail>
                                                    <Detail label="Paid">{total.paid}</Detail>
                                                    <Detail label="Outstanding">{total.balance}</Detail>
                                                    <Detail label="Overdue">
                                                        <span className={cn(!isZero(total.overdue) && 'font-medium text-red-700 dark:text-red-300')}>
                                                            {total.overdue}
                                                        </span>
                                                    </Detail>
                                                    <Detail label="Credit available">{total.available_credit}</Detail>
                                                </dl>
                                            </div>
                                        ))
                                    )}
                                    {canStatement && (
                                        <Button variant="outline" size="sm" className="w-full" asChild>
                                            <Link href={route('admin.customers.statement', customer.id)}>
                                                <FileText className="size-4" />
                                                Account statement
                                            </Link>
                                        </Button>
                                    )}
                                </AsideCard>
                            )}

                            <AsideCard title="Billing details" icon={Building2}>
                                {address.length > 0 ? (
                                    <address className="text-sm leading-6 not-italic">
                                        {address.map((line, i) => (
                                            <div key={i} className="break-words">
                                                {line}
                                            </div>
                                        ))}
                                    </address>
                                ) : (
                                    <p className="text-muted-foreground text-sm">No billing address added.</p>
                                )}
                                <dl className="space-y-3 border-t pt-3 text-sm">
                                    <Detail label="Tax ID">{customer.tax_identifier || '—'}</Detail>
                                    <Detail label="Currency">{customer.default_currency || '—'}</Detail>
                                    <Detail label="Phone">{formatPhoneDisplay(customer.phone, customer.billing_country)}</Detail>
                                    {customer.website && (
                                        <Detail label="Website">
                                            <a
                                                href={customer.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="break-all hover:underline"
                                            >
                                                {customer.website.replace(/^https?:\/\//, '')}
                                            </a>
                                        </Detail>
                                    )}
                                </dl>
                            </AsideCard>

                            <AsideCard title="Internal notes" icon={StickyNote}>
                                <p
                                    className={cn(
                                        'text-sm leading-6 break-words whitespace-pre-wrap',
                                        !customer.internal_notes && 'text-muted-foreground',
                                    )}
                                >
                                    {customer.internal_notes || 'No internal notes added.'}
                                </p>
                                <p className="text-muted-foreground text-xs">Staff only — never shown to the customer.</p>
                            </AsideCard>
                        </>
                    }
                />
            </PageContainer>
            <Dialog
                open={editing !== null}
                onOpenChange={(open) => {
                    if (!open) void closeContact();
                }}
            >
                <DialogContent className="sm:max-w-lg" onInteractOutside={(event) => event.preventDefault()}>
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
                            defaultCountry={customer.billing_country}
                            contact={editing === 'new' ? undefined : editing}
                            onClose={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function isZero(value: string): boolean {
    return /^-?0(?:\.0+)?$/.test(value);
}
