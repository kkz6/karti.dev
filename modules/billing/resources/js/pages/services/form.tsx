import { Head, Link, useForm } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import { continueWithoutUnsavedChangesPrompt, UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import { BriefcaseBusiness as BillingPageIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { BillingFormCanvas, BillingFormFrame, useBillingModalForm } from '../../components/billing-create-modal';
import { BillingFeedback } from '../../components/billing-feedback';
import { BillingSelect, BillingSelectItem } from '../../components/billing-select';
import { CatalogueActions } from '../../components/catalogue-actions';
import type { CataloguePermissions, CurrencyOption, Service, TaxRate } from '../../types';

export default function ServiceForm({
    service,
    currencies,
    defaultCurrency,
    taxRates,
    readOnly = false,
    can,
    message,
}: {
    service?: Service | null;
    currencies: CurrencyOption[];
    defaultCurrency: string;
    taxRates: TaxRate[];
    readOnly?: boolean;
    can: CataloguePermissions;
    message?: string;
}) {
    const form = useForm({
        name: service?.name ?? '',
        description: service?.description ?? '',
        unit: service?.unit ?? 'hour',
        rate: service?.rate ?? '',
        currency: service?.currency ?? defaultCurrency,
        tax_rate_ids: service?.tax_rates.map((tax) => tax.id) ?? [],
    });
    const modal = useBillingModalForm(form);
    const title = readOnly ? (service?.name ?? 'Service') : service ? 'Edit service' : 'Add service';
    const submit = (event: FormEvent) => {
        event.preventDefault();
        continueWithoutUnsavedChangesPrompt(() =>
            service ? form.patch(route('admin.services.update', service.id)) : form.post(route('admin.services.store'), modal?.visitOptions),
        );
    };
    return (
        <BillingFormFrame
            breadcrumbs={[
                { title: 'Services', href: route('admin.services.index') },
                { title, href: service ? route('admin.services.show', service.id) : route('admin.services.create') },
            ]}
        >
            {!modal && <Head title={title} />}
            <UnsavedChangesGuard dirty={!readOnly && form.isDirty && !form.processing} />
            <BillingFormCanvas className="max-w-4xl space-y-7">
                {!modal && (
                    <div className="flex flex-wrap justify-between gap-4">
                        <div>
                            <IndexHeader title={title} icon={BillingPageIcon} />
                            <p className="text-muted-foreground mt-2 text-sm">
                                {service?.archived_at
                                    ? 'Archived. Restore this service before editing it.'
                                    : 'A reusable description and price for your invoices.'}
                            </p>
                        </div>
                        {readOnly && service && (
                            <CatalogueActions id={service.id} archived={!!service.archived_at} can={can} prefix="admin.services" />
                        )}
                    </div>
                )}
                {message && <BillingFeedback kind="success">{message}</BillingFeedback>}
                <form onSubmit={submit} className={modal ? 'space-y-5' : 'bg-card max-w-4xl space-y-6 rounded-xl border p-5 sm:p-6'}>
                    {Object.values(form.errors).length > 0 && (
                        <BillingFeedback kind="error">
                            {Object.values(form.errors).map((error, i) => (
                                <p key={i}>{error}</p>
                            ))}
                        </BillingFeedback>
                    )}
                    <fieldset disabled={readOnly} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name">Service name *</Label>
                            <Input id="name" required value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                rows={4}
                                value={form.data.description}
                                onChange={(e) => form.setData('description', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-5 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit *</Label>
                                <Input id="unit" required value={form.data.unit} onChange={(e) => form.setData('unit', e.target.value)} />
                                <p className="text-muted-foreground text-xs">For example: hour, day or project.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rate">Unit price *</Label>
                                <Input
                                    id="rate"
                                    type="number"
                                    min="0"
                                    max="999999999.9999"
                                    step="0.0001"
                                    required
                                    value={form.data.rate}
                                    onChange={(e) => form.setData('rate', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="currency">Currency *</Label>
                                <BillingSelect
                                    id="currency"
                                    required
                                    value={form.data.currency}
                                    onValueChange={(value) => form.setData('currency', value)}
                                    disabled={readOnly || form.processing}
                                    placeholder="Choose currency"
                                >
                                    {currencies.map((currency) => (
                                        <BillingSelectItem key={currency.code} value={currency.code}>
                                            {currency.code} — {currency.name}
                                        </BillingSelectItem>
                                    ))}
                                </BillingSelect>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h2 className="font-semibold">Default taxes</h2>
                            <p className="text-muted-foreground text-sm">
                                Select rates to offer with this service. Archived rates are omitted from new catalogue selections.
                            </p>
                            {taxRates.length === 0 && (
                                <p className="text-muted-foreground text-sm">No tax presets yet. You can save this service without tax defaults.</p>
                            )}
                            {taxRates.map((tax) => (
                                <Label key={tax.id} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={form.data.tax_rate_ids.includes(tax.id)}
                                        disabled={!!tax.archived_at && !form.data.tax_rate_ids.includes(tax.id)}
                                        onCheckedChange={(checked) =>
                                            form.setData(
                                                'tax_rate_ids',
                                                checked === true
                                                    ? [...form.data.tax_rate_ids, tax.id]
                                                    : form.data.tax_rate_ids.filter((id) => id !== tax.id),
                                            )
                                        }
                                    />
                                    {tax.name} ({tax.percentage.replace(/\.?0+$/, '') || '0'}%){tax.archived_at ? ' — archived' : ''}
                                </Label>
                            ))}
                        </div>
                    </fieldset>
                    {!readOnly && (
                        <div className="flex gap-3">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving…' : 'Save service'}
                            </Button>
                            {modal ? (
                                <Button type="button" variant="outline" onClick={() => void modal.requestClose()}>
                                    Cancel
                                </Button>
                            ) : (
                                <Button variant="outline" asChild>
                                    <Link href={service ? route('admin.services.show', service.id) : route('admin.services.index')}>Cancel</Link>
                                </Button>
                            )}
                        </div>
                    )}
                </form>
            </BillingFormCanvas>
        </BillingFormFrame>
    );
}
