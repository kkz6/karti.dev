import { BillingPageContainer as PageContainer } from '@billing/components/billing-page-container';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { DateField } from '@shared/components/date-field';
import { IndexHeader } from '@shared/components/index-header';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@shared/components/ui/collapsible';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { continueWithoutUnsavedChangesPrompt, UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import AppLayout from '@shared/layouts/app-layout';
import axios from 'axios';
import { Receipt as BillingPageIcon, Plus, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { BillingFeedback } from '../../components/billing-feedback';
import { BillingSelect, BillingSelectItem } from '../../components/billing-select';
import { CustomerPicker } from '../../components/customer-picker';
import { InvoiceHistory, type InvoiceActivity } from '../../components/invoice-document';
import { InvoiceItemEditor, InvoiceItemsHeader } from '../../components/invoice-item-editor';
import { InvoicePdfButtons } from '../../components/invoice-pdf-buttons';
import { SortableInvoiceItem } from '../../components/sortable-invoice-item';
import { useBillingConfirm } from '../../components/use-billing-confirm';
import {
    blankLine,
    editableInvoice,
    type CustomerChoice,
    type InvoiceData,
    type InvoiceFormData,
    type InvoiceLine,
    type InvoiceTotals,
} from '../../invoice-types';
import { lineAmounts } from '../../lib/line-amounts';
import type { CurrencyOption, TaxRate } from '../../types';

type Defaults = { currency: string; invoice_date: string; due_date: string; terms: string; payment_instructions: string };

export default function InvoiceForm({
    canDownloadPdf,
    pdfError,
    invoice,
    lockedCustomer = null,
    customers,
    currencies,
    taxRates,
    defaults,
    readOnly,
    canUpdate,
    canIssue,
    activities,
    footerTarget,
    embedded = false,
    onSaved,
    onReview,
    onModalStateChange,
    onItemDragChange,
}: {
    invoice: InvoiceData | null;
    lockedCustomer?: CustomerChoice | null;
    canDownloadPdf: boolean;
    pdfError?: string;
    customers: CustomerChoice[];
    currencies: CurrencyOption[];
    taxRates: TaxRate[];
    defaults: Defaults;
    readOnly: boolean;
    canUpdate: boolean;
    message?: string;
    canIssue: boolean;
    activities: InvoiceActivity[];
    footerTarget?: HTMLElement | null;
    embedded?: boolean;
    onSaved?: (data: InvoiceFormSeed) => void;
    onReview?: (invoice: InvoiceData) => void;
    onModalStateChange?: (dirty: boolean, busy: boolean) => void;
    onItemDragChange?: (dragging: boolean) => void;
}) {
    const { confirm, dialog } = useBillingConfirm();

    const form = useForm<InvoiceFormData>(
        invoice
            ? editableInvoice(invoice)
            : {
                  ...defaults,
                  customer_id: lockedCustomer ? String(lockedCustomer.id) : '',
                  version: null,
                  discount_mode: 'none',
                  discount_value: '0',
                  customer_note: '',
                  internal_note: '',
                  refresh_customer: false,
                  items: [blankLine()],
              },
    );
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({});
    const busy = saving || form.processing;
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    useEffect(() => onModalStateChange?.(form.isDirty, busy), [form.isDirty, busy, onModalStateChange]);
    const fieldErrors = { ...previewErrors, ...form.errors } as Record<string, string>;
    const [choices, setChoices] = useState(customers);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerError, setCustomerError] = useState('');
    const [totals, setTotals] = useState<InvoiceTotals | null>(invoice?.totals ?? null);
    const [previewError, setPreviewError] = useState('');
    const [calculating, setCalculating] = useState(false);
    const [previewVersion, setPreviewVersion] = useState(0);
    const title = invoice ? `Draft #${invoice.id}` : 'New invoice draft';
    const invoiceId = invoice?.id;

    useEffect(() => {
        if (readOnly || lockedCustomer) return;
        const abort = new AbortController();
        const timer = setTimeout(
            () =>
                axios
                    .get(route('admin.invoices.customer-options'), { params: { search: customerSearch }, signal: abort.signal })
                    .then(({ data }) => {
                        setChoices((previous) => {
                            const selected = previous.find((customer) => String(customer.id) === form.data.customer_id);
                            return selected && !data.customers.some((customer: CustomerChoice) => customer.id === selected.id)
                                ? [selected, ...data.customers]
                                : data.customers;
                        });
                        setCustomerError('');
                    })
                    .catch((error) => {
                        if (!axios.isCancel(error)) setCustomerError('Customers could not be loaded. Try again.');
                    }),
            250,
        );
        return () => {
            clearTimeout(timer);
            abort.abort();
        };
    }, [customerSearch, lockedCustomer, readOnly, form.data.customer_id]);

    useEffect(() => {
        if (readOnly) return;
        const abort = new AbortController();
        setTotals(null);
        setPreviewError('');
        if (
            !form.data.customer_id ||
            !form.data.currency ||
            !form.data.items.length ||
            form.data.items.some((line) => !line.description.trim() || !line.rate || !line.quantity)
        ) {
            setCalculating(false);
            return;
        }
        setCalculating(true);
        const timer = setTimeout(() => {
            const url = invoiceId ? route('admin.invoices.draft-preview', invoiceId) : route('admin.invoices.preview');
            axios
                .post(url, form.data, { signal: abort.signal })
                .then(({ data }) => {
                    setTotals(data);
                    setPreviewErrors({});
                    setCalculating(false);
                })
                .catch((error) => {
                    if (axios.isCancel(error)) return;
                    setCalculating(false);
                    const errors = error.response?.data?.errors ?? {};
                    setPreviewErrors(
                        Object.fromEntries(
                            Object.entries(errors).map(([key, value]) => [key, Array.isArray(value) ? value.join(' ') : String(value)]),
                        ),
                    );
                    const messages = Object.values(errors).flat();
                    setPreviewError(messages.length ? messages.map(String).join(' ') : 'Totals could not be calculated. Try again before saving.');
                });
        }, 350);
        return () => {
            clearTimeout(timer);
            abort.abort();
        };
    }, [form.data, invoiceId, readOnly, previewVersion]);

    const updateLine = (index: number, patch: Partial<InvoiceLine>) =>
        form.setData(
            'items',
            form.data.items.map((line, i) => (i === index ? { ...line, ...patch } : line)),
        );
    const move = (index: number, direction: number) => {
        const rows = [...form.data.items];
        const [line] = rows.splice(index, 1);
        rows.splice(index + direction, 0, line);
        form.setData('items', rows);
    };
    const setCurrency = async (currency: string) => {
        if (currency === form.data.currency) return;
        if (form.data.items.some((line) => line.rate !== '') && !(await confirm('Change invoice currency? Re-enter each price in the new currency.')))
            return;
        form.setData({
            ...form.data,
            currency,
            items: form.data.items.map((line) => ({ ...line, rate: '', service_id: null })),
            discount_value: '0',
        });
    };
    const saveEmbedded = async (review = false) => {
        if (busy) return;
        setSaving(true);
        setSaveError('');
        form.clearErrors();
        try {
            const response = invoice
                ? await axios.patch(
                      lockedCustomer
                          ? route('admin.customers.invoices.update', [lockedCustomer.id, invoice.id])
                          : route('admin.invoices.update', invoice.id),
                      form.data,
                  )
                : await axios.post(
                      lockedCustomer ? route('admin.customers.invoices.store', lockedCustomer.id) : route('admin.invoices.store'),
                      form.data,
                  );
            const saved = response.data as InvoiceFormSeed;
            const next = editableInvoice(saved.invoice!);
            form.setData(next);
            form.setDefaults(next);
            setTotals(saved.invoice!.totals);
            onSaved?.(saved);
            if (review) onReview?.(saved.invoice!);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                form.setError(
                    Object.fromEntries(
                        Object.entries(error.response.data.errors).map(([key, value]) => [
                            key,
                            Array.isArray(value) ? value.join(' ') : String(value),
                        ]),
                    ),
                );
            } else setSaveError('The draft could not be saved. Your entries are still here; try again.');
        } finally {
            setSaving(false);
        }
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (embedded) {
            void saveEmbedded();
            return;
        }
        const options = {
            preserveScroll: true,
            onSuccess: (page: { props: Record<string, unknown> }) => {
                const saved = page.props.invoice as InvoiceData;
                const data = editableInvoice(saved);
                form.setData(data);
                form.setDefaults(data);
                setTotals(saved.totals);
            },
        };
        continueWithoutUnsavedChangesPrompt(() =>
            invoice ? form.patch(route('admin.invoices.update', invoice.id), options) : form.post(route('admin.invoices.store'), options),
        );
    };
    const selectedCustomer = choices.find((customer) => String(customer.id) === form.data.customer_id);
    const precision = currencies.find((currency) => currency.code === form.data.currency)?.precision ?? 2;
    const liveAmounts = lineAmounts(form.data, precision);
    const editorActions = (
        <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
                type={embedded ? 'button' : 'submit'}
                onClick={embedded ? () => void saveEmbedded() : undefined}
                variant={embedded ? 'outline' : 'default'}
                disabled={busy}
            >
                {busy ? 'Saving…' : 'Save draft'}
            </Button>
            {embedded && canIssue && (
                <Button type="button" disabled={busy} onClick={() => void saveEmbedded(true)}>
                    <ShieldCheck className="size-4" />
                    {busy ? 'Verifying…' : 'Verify & review'}
                </Button>
            )}
            {!embedded && (
                <Button variant="outline" asChild>
                    <Link href={route('admin.invoices.index')}>Back to invoices</Link>
                </Button>
            )}
        </div>
    );
    const Canvas = embedded ? 'div' : PageContainer;
    return (
        <InvoiceFormLayout embedded={embedded} title={title} invoiceId={invoice?.id}>
            {dialog}
            {!embedded && <Head title={title} />}
            <UnsavedChangesGuard dirty={!readOnly && form.isDirty && !form.processing} />
            <Canvas className={embedded ? 'space-y-5' : 'max-w-6xl space-y-6'}>
                {!embedded && (
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <IndexHeader title={title} icon={BillingPageIcon} />
                                <Badge variant="secondary">Draft</Badge>
                            </div>
                            <p className="text-muted-foreground text-sm">Prepare the invoice details and review the totals before saving.</p>
                        </div>
                        {readOnly && canUpdate && invoice && (
                            <Button asChild>
                                <Link href={route('admin.invoices.edit', invoice.id)}>Edit draft</Link>
                            </Button>
                        )}
                    </div>
                )}
                {!embedded && canDownloadPdf && invoice && (
                    <>
                        <InvoicePdfButtons invoiceId={invoice.id} draft disabled={!readOnly && (form.isDirty || form.processing)} />
                        {!readOnly && form.isDirty && <p className="text-muted-foreground text-sm">Save your changes before generating a PDF.</p>}
                    </>
                )}
                {pdfError && <BillingFeedback kind="error">{pdfError}</BillingFeedback>}
                {!embedded && invoice && canIssue && !form.isDirty && (
                    <Button variant="outline" asChild>
                        <Link href={route('admin.invoices.issue-review', invoice.id)}>Review and issue</Link>
                    </Button>
                )}
                {saveError && <BillingFeedback kind="error">{saveError}</BillingFeedback>}
                <form noValidate={embedded} onSubmit={submit} className="space-y-6">
                    {Object.values(form.errors).length > 0 && (
                        <BillingFeedback kind="error">
                            {Object.values(form.errors).map((error, i) => (
                                <p key={i}>{error}</p>
                            ))}
                            {form.errors.version && invoice && (
                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={async () => {
                                        if (await confirm('Reload the latest draft? Unsaved changes will be discarded.')) {
                                            continueWithoutUnsavedChangesPrompt(() =>
                                                router.visit(route('admin.invoices.edit', invoice.id), { preserveState: false }),
                                            );
                                        }
                                    }}
                                >
                                    Reload draft
                                </Button>
                            )}
                        </BillingFeedback>
                    )}
                    <fieldset disabled={readOnly || busy} className="min-w-0 space-y-6">
                        <div className="space-y-6">
                            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customer_id">Customer *</Label>

                                    {lockedCustomer ? (
                                        <Input
                                            id="customer_id"
                                            value={lockedCustomer.display_name}
                                            readOnly
                                            aria-label="Customer (fixed to this profile)"
                                        />
                                    ) : (
                                        <CustomerPicker
                                            choices={choices}
                                            search={customerSearch}
                                            onSearch={setCustomerSearch}
                                            id="customer_id"
                                            required
                                            value={form.data.customer_id}
                                            onValueChange={async (value) => {
                                                const selected = choices.find((customer) => String(customer.id) === value);
                                                let currency = form.data.currency;
                                                const preferred = selected?.default_currency || defaults.currency;
                                                if (!invoice && currencies.some((entry) => entry.code === preferred) && preferred !== currency) {
                                                    const hasPrices = form.data.items.some((item) => item.rate !== '');
                                                    if (
                                                        !hasPrices ||
                                                        (await confirm(
                                                            `Use this customer's ${preferred} default currency? Existing prices will be cleared for you to re-enter.`,
                                                        ))
                                                    )
                                                        currency = preferred;
                                                }
                                                form.setData({
                                                    ...form.data,
                                                    customer_id: value,
                                                    currency,
                                                    refresh_customer: false,
                                                    items:
                                                        currency === form.data.currency
                                                            ? form.data.items
                                                            : form.data.items.map((item) => ({ ...item, rate: '', service_id: null })),
                                                });
                                            }}
                                            disabled={readOnly || busy}
                                            placeholder="Choose customer"
                                        />
                                    )}
                                    {customerError && <BillingFeedback kind="error">{customerError}</BillingFeedback>}
                                    {selectedCustomer?.archived_at && (
                                        <p className="text-muted-foreground text-xs">
                                            This draft retains an archived customer. Restore the customer before issuing an invoice.
                                        </p>
                                    )}
                                    {invoice && !readOnly && (
                                        <Label className="flex items-center gap-2 text-xs">
                                            <Checkbox
                                                checked={form.data.refresh_customer}
                                                onCheckedChange={(checked) => form.setData('refresh_customer', checked === true)}
                                            />
                                            Refresh customer billing details when saving
                                        </Label>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="invoice_date">Invoice date *</Label>
                                    <DateField
                                        id="invoice_date"
                                        value={form.data.invoice_date}
                                        onChange={(value) => form.setData('invoice_date', value)}
                                        label="Invoice date"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Due date</Label>
                                    <DateField
                                        id="due_date"
                                        value={form.data.due_date}
                                        onChange={(value) => form.setData('due_date', value)}
                                        label="Due date"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency *</Label>
                                    <BillingSelect
                                        id="currency"
                                        required
                                        value={form.data.currency}
                                        onValueChange={(value) => setCurrency(value)}
                                        disabled={readOnly || busy}
                                        placeholder="Choose currency"
                                    >
                                        {currencies.map((currency) => (
                                            <BillingSelectItem key={currency.code} value={currency.code}>
                                                {currency.code} — {currency.name}
                                            </BillingSelectItem>
                                        ))}
                                    </BillingSelect>
                                </div>
                            </section>
                            {invoice && (
                                <Card className="bg-muted/20 grid gap-4 p-4 sm:grid-cols-2">
                                    <div>
                                        <h2 className="mb-2 text-sm font-semibold">Saved customer details</h2>
                                        <p className="text-sm">{invoice.customer_snapshot.legal_name || invoice.customer_snapshot.display_name}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {[
                                                invoice.customer_snapshot.billing_address,
                                                invoice.customer_snapshot.billing_city,
                                                invoice.customer_snapshot.billing_country,
                                            ]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>
                                    </div>
                                    <div>
                                        <h2 className="mb-2 text-sm font-semibold">Saved company identity</h2>
                                        <p className="text-sm">
                                            {invoice.seller_snapshot.legal_name ||
                                                invoice.seller_snapshot.display_name ||
                                                'Company details have not been configured.'}
                                        </p>
                                    </div>
                                </Card>
                            )}

                            <section className="space-y-3">
                                <h2 className="text-lg font-semibold">Invoice items</h2>
                                <p className="text-muted-foreground text-xs">Drag handles to reorder items. Use the item menu for more actions.</p>
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                                    onDragStart={() => onItemDragChange?.(true)}
                                    onDragCancel={() => onItemDragChange?.(false)}
                                    onDragEnd={({ active, over }) => {
                                        onItemDragChange?.(false);
                                        if (!readOnly && !busy && over && active.id !== over.id) {
                                            form.setData(
                                                'items',
                                                arrayMove(
                                                    form.data.items,
                                                    form.data.items.findIndex((item) => item.key === active.id),
                                                    form.data.items.findIndex((item) => item.key === over.id),
                                                ),
                                            );
                                        }
                                    }}
                                >
                                    <SortableContext items={form.data.items.map((item) => item.key)} strategy={verticalListSortingStrategy}>
                                        <div role="table" aria-label="Invoice items" aria-colcount={7} className="overflow-hidden rounded-lg border">
                                            <InvoiceItemsHeader />
                                            <div data-invoice-items-body className="relative isolate overflow-hidden">
                                                {form.data.items.map((line, index) => (
                                                    <SortableInvoiceItem
                                                        key={line.key}
                                                        id={line.key}
                                                        number={index + 1}
                                                        disabled={readOnly || busy || form.data.items.length < 2}
                                                    >
                                                        {(handle) => (
                                                            <InvoiceItemEditor
                                                                line={line}
                                                                index={index}
                                                                handle={handle}
                                                                total={
                                                                    readOnly
                                                                        ? totals?.lines.find((item) => item.key === line.key)?.total
                                                                        : liveAmounts[line.key]
                                                                }
                                                                taxRates={taxRates}
                                                                readOnly={readOnly || busy}
                                                                canRemove={form.data.items.length > 1}
                                                                canDuplicate={form.data.items.length < 100}
                                                                canMoveUp={index > 0}
                                                                canMoveDown={index < form.data.items.length - 1}
                                                                onChange={(patch) => updateLine(index, patch)}
                                                                onMove={(direction) => move(index, direction)}
                                                                onRemove={() =>
                                                                    form.setData(
                                                                        'items',
                                                                        form.data.items.filter((item) => item.key !== line.key),
                                                                    )
                                                                }
                                                                onDuplicate={() => {
                                                                    const items = [...form.data.items];
                                                                    items.splice(index + 1, 0, {
                                                                        ...line,
                                                                        key: blankLine().key,
                                                                        taxes: line.taxes.map((tax) => ({ ...tax })),
                                                                    });
                                                                    form.setData('items', items);
                                                                }}
                                                                errors={fieldErrors}
                                                            />
                                                        )}
                                                    </SortableInvoiceItem>
                                                ))}
                                            </div>
                                        </div>
                                    </SortableContext>
                                </DndContext>
                                {!readOnly && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={form.data.items.length >= 100}
                                        onClick={() => form.setData('items', [...form.data.items, blankLine()])}
                                    >
                                        <Plus className="size-4" />
                                        Add line
                                    </Button>
                                )}
                            </section>
                            <section className="grid gap-6 border-t pt-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="discount_mode">Discount before tax</Label>
                                        <BillingSelect
                                            id="discount_mode"
                                            value={form.data.discount_mode}
                                            onValueChange={(value) =>
                                                form.setData({
                                                    ...form.data,
                                                    discount_mode: value as InvoiceFormData['discount_mode'],
                                                    discount_value: '0',
                                                })
                                            }
                                            disabled={readOnly || busy}
                                        >
                                            <BillingSelectItem value="none">No discount</BillingSelectItem>
                                            <BillingSelectItem value="percent">Percentage</BillingSelectItem>
                                            <BillingSelectItem value="fixed">Fixed amount</BillingSelectItem>
                                        </BillingSelect>
                                    </div>
                                    {form.data.discount_mode !== 'none' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="discount_value">
                                                {form.data.discount_mode === 'percent'
                                                    ? 'Discount percentage'
                                                    : `Discount amount (${form.data.currency})`}
                                            </Label>
                                            <Input
                                                id="discount_value"
                                                type="number"
                                                min="0"
                                                max={form.data.discount_mode === 'percent' ? '100' : undefined}
                                                step={form.data.discount_mode === 'percent' ? '0.0001' : precision === 0 ? '1' : '0.01'}
                                                value={form.data.discount_value}
                                                onChange={(e) => form.setData('discount_value', e.target.value)}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                                <Card aria-live="polite" className="bg-muted/20 space-y-3 p-5">
                                    <h2 className="font-semibold">Invoice totals</h2>
                                    {calculating ? (
                                        <p className="text-muted-foreground text-sm">Calculating totals…</p>
                                    ) : previewError ? (
                                        <div>
                                            <BillingFeedback kind="error">{previewError}</BillingFeedback>
                                            {!readOnly && (
                                                <Button
                                                    variant="outline"
                                                    type="button"
                                                    className="mt-3"
                                                    onClick={() => setPreviewVersion((version) => version + 1)}
                                                >
                                                    Retry totals
                                                </Button>
                                            )}
                                        </div>
                                    ) : totals ? (
                                        <dl className="space-y-3 text-sm tabular-nums">
                                            {[
                                                ['Subtotal', totals.subtotal],
                                                ['Discount', totals.discount],
                                                ...totals.tax_groups.map((tax) => [
                                                    `${tax.name} (${tax.percentage.replace(/\.?0+$/, '') || '0'}%)`,
                                                    tax.amount,
                                                ]),
                                                ['Total', totals.total],
                                            ].map(([label, value], i) => (
                                                <div
                                                    key={`${label}-${i}`}
                                                    className={`flex justify-between gap-5 ${label === 'Total' ? 'border-t pt-3 text-base font-semibold' : ''}`}
                                                >
                                                    <dt>{label}</dt>
                                                    <dd className="shrink-0">
                                                        {label === 'Discount' ? '−' : ''}
                                                        {value} {totals.currency}
                                                    </dd>
                                                </div>
                                            ))}
                                        </dl>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">
                                            Choose a customer and currency, then enter at least one complete line.
                                        </p>
                                    )}
                                </Card>
                            </section>

                            <Collapsible defaultOpen={readOnly}>
                                <CollapsibleTrigger asChild>
                                    <Button type="button" variant="link" className="p-0 text-sm">
                                        Notes, terms & payment instructions
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-4">
                                    {' '}
                                    <section className="grid gap-5 sm:grid-cols-2">
                                        {(['customer_note', 'internal_note', 'terms', 'payment_instructions'] as const).map((field) => (
                                            <div key={field} className="space-y-2">
                                                <Label htmlFor={field}>
                                                    {
                                                        {
                                                            customer_note: 'Customer note',
                                                            internal_note: 'Internal note',
                                                            terms: 'Terms',
                                                            payment_instructions: 'Payment instructions',
                                                        }[field]
                                                    }
                                                </Label>
                                                <Textarea
                                                    id={field}
                                                    rows={3}
                                                    value={form.data[field]}
                                                    onChange={(e) => form.setData(field, e.target.value)}
                                                />
                                                {field === 'internal_note' && (
                                                    <p className="text-muted-foreground text-xs">Private notes for your team.</p>
                                                )}
                                            </div>
                                        ))}
                                    </section>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </fieldset>
                    {!readOnly && (embedded && footerTarget ? createPortal(editorActions, footerTarget) : editorActions)}
                </form>
                {!embedded && invoice && <InvoiceHistory activities={activities} />}
            </Canvas>
        </InvoiceFormLayout>
    );
}

export type InvoiceFormSeed = {
    invoice: InvoiceData | null;
    lockedCustomer?: CustomerChoice | null;
    canDownloadPdf: boolean;
    pdfError?: string;
    customers: CustomerChoice[];
    currencies: CurrencyOption[];
    taxRates: TaxRate[];
    defaults: Defaults;
    readOnly: boolean;
    canUpdate: boolean;
    message?: string;
    canIssue: boolean;
    activities: InvoiceActivity[];
};

function InvoiceFormLayout({ embedded, title, invoiceId, children }: { embedded: boolean; title: string; invoiceId?: number; children: ReactNode }) {
    return embedded ? (
        <>{children}</>
    ) : (
        <AppLayout
            breadcrumbs={[
                { title: 'Invoices', href: route('admin.invoices.index') },
                { title, href: invoiceId ? route('admin.invoices.show', invoiceId) : route('admin.invoices.create') },
            ]}
        >
            {children}
        </AppLayout>
    );
}
