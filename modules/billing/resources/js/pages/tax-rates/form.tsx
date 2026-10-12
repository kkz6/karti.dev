import { Head, Link, useForm } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { continueWithoutUnsavedChangesPrompt, UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import { Percent as BillingPageIcon } from 'lucide-react';
import type { FormEvent } from 'react';
import { BillingFormCanvas, BillingFormFrame, useBillingModalForm } from '../../components/billing-create-modal';
import { BillingFeedback } from '../../components/billing-feedback';
import { CatalogueActions } from '../../components/catalogue-actions';
import type { CataloguePermissions, TaxRate } from '../../types';

export default function TaxRateForm({
    taxRate,
    readOnly = false,
    can,
}: {
    taxRate?: TaxRate;
    readOnly?: boolean;
    can?: CataloguePermissions;
    message?: string;
}) {
    const form = useForm({ name: taxRate?.name ?? '', percentage: taxRate?.percentage ?? '' });
    const modal = useBillingModalForm(form);
    const title = readOnly ? (taxRate?.name ?? 'Tax preset') : taxRate ? 'Edit tax preset' : 'Add tax preset';
    const submit = (event: FormEvent) => {
        event.preventDefault();
        continueWithoutUnsavedChangesPrompt(() =>
            taxRate
                ? form.patch(route('admin.tax-rates.update', taxRate.id), modal?.visitOptions)
                : form.post(route('admin.tax-rates.store'), modal?.visitOptions),
        );
    };
    return (
        <BillingFormFrame
            breadcrumbs={[
                { title: 'Tax presets', href: route('admin.tax-rates.index') },
                { title, href: taxRate ? route('admin.tax-rates.show', taxRate.id) : route('admin.tax-rates.create') },
            ]}
        >
            {!modal && <Head title={title} />}
            <UnsavedChangesGuard dirty={!readOnly && form.isDirty && !form.processing} />
            <BillingFormCanvas className="max-w-3xl space-y-7">
                {!modal && (
                    <div className="flex flex-wrap justify-between gap-4">
                        <div>
                            <IndexHeader title={title} icon={BillingPageIcon} />
                            <p className="text-muted-foreground mt-2 text-sm">
                                {taxRate?.archived_at
                                    ? 'Archived. Restore this preset before editing it.'
                                    : 'A named percentage rate for your service catalogue.'}
                            </p>
                        </div>
                        {readOnly && taxRate && can && (
                            <CatalogueActions id={taxRate.id} archived={!!taxRate.archived_at} can={can} prefix="admin.tax-rates" />
                        )}
                    </div>
                )}
                <form onSubmit={submit} className={modal ? 'space-y-5' : 'bg-card max-w-4xl space-y-6 rounded-xl border p-5 sm:p-6'}>
                    {Object.values(form.errors).length > 0 && (
                        <BillingFeedback kind="error">
                            {Object.values(form.errors).map((error, i) => (
                                <p key={i}>{error}</p>
                            ))}
                        </BillingFeedback>
                    )}
                    <fieldset disabled={readOnly} className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tax name *</Label>
                            <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="percentage">Percentage *</Label>
                            <Input
                                id="percentage"
                                type="number"
                                min="0"
                                max="100"
                                step="0.0001"
                                value={form.data.percentage}
                                onChange={(e) => form.setData('percentage', e.target.value)}
                                required
                            />
                            <p className="text-muted-foreground text-xs">0–100%, with up to four decimal places.</p>
                        </div>
                    </fieldset>
                    {!readOnly && (
                        <div className="flex gap-3">
                            <Button type="submit" disabled={form.processing}>
                                {form.processing ? 'Saving…' : 'Save tax preset'}
                            </Button>
                            {modal ? (
                                <Button type="button" variant="outline" onClick={() => void modal.requestClose()}>
                                    Cancel
                                </Button>
                            ) : (
                                <Button variant="outline" asChild>
                                    <Link href={taxRate ? route('admin.tax-rates.show', taxRate.id) : route('admin.tax-rates.index')}>Cancel</Link>
                                </Button>
                            )}
                        </div>
                    )}
                </form>
            </BillingFormCanvas>
        </BillingFormFrame>
    );
}
