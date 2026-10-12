import { BillingSettingsWorkspace } from '@billing/components/billing-settings-workspace';
import { useForm } from '@inertiajs/react';
import { SimpleAssetsField } from '@media/components/Field/SimpleAssetsField';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { PhoneInput } from '@shared/components/ui/phone-input';
import { Switch } from '@shared/components/ui/switch';
import { Textarea } from '@shared/components/ui/textarea';
import { continueWithoutUnsavedChangesPrompt, UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import { useMemo, useState, type FormEvent } from 'react';
import { BillingFeedback } from '../components/billing-feedback';
import { BillingSelect, BillingSelectItem } from '../components/billing-select';
import type { BillingSettings, CurrencyOption } from '../types';

const identity = [
    ['display_name', 'Company display name'],
    ['legal_name', 'Legal company name'],
    ['address', 'Address'],
    ['address_line_2', 'Address line 2'],
    ['city', 'City'],
    ['state', 'State or region'],
    ['postal_code', 'Postal code'],
    ['country', 'Country code'],
    ['tax_identifier', 'Tax identifier'],
    ['email', 'Billing email'],
    ['phone', 'Phone'],
] as const;

export default function Settings({
    settings,
    currencies,
    timezones,
    canUpdate,
    section,
}: {
    settings: BillingSettings;
    section: 'company' | 'invoices';
    currencies: CurrencyOption[];
    timezones: string[];
    canUpdate: boolean;
    saved: boolean;
}) {
    const form = useForm({ ...settings, due_days: String(settings.due_days), number_padding: String(settings.number_padding) });
    const [logoError, setLogoError] = useState('');
    const [signatureError, setSignatureError] = useState('');
    const signatureIds = useMemo(() => (form.data.signature_media_id ? [String(form.data.signature_media_id)] : []), [form.data.signature_media_id]);
    const logoIds = useMemo(() => (form.data.logo_media_id ? [String(form.data.logo_media_id)] : []), [form.data.logo_media_id]);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.transform((data) => {
            const fields =
                section === 'company'
                    ? [...identity.map(([key]) => key), 'logo_media_id', 'timezone']
                    : [
                          'default_currency',
                          'due_days',
                          'number_prefix',
                          'number_padding',
                          'default_terms',
                          'payment_instructions',
                          'signature_media_id',
                          'show_signature_on_invoices',
                      ];
            const normalized = { ...data, due_days: Number(data.due_days), number_padding: Number(data.number_padding) };
            return { ...Object.fromEntries(fields.map((key) => [key, normalized[key as keyof typeof normalized]])), section };
        });
        continueWithoutUnsavedChangesPrompt(() =>
            form.put(route('admin.settings.billing.update'), { preserveScroll: true, onSuccess: () => form.setDefaults() }),
        );
    };
    return (
        <BillingSettingsWorkspace section={section}>
            <UnsavedChangesGuard dirty={canUpdate && form.isDirty && !form.processing} />

            <div>
                <h2 className="text-lg font-semibold">{section === 'company' ? 'Company' : 'Invoice settings'}</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                    {section === 'company'
                        ? 'Your billing identity, company logo and business timezone. New invoices use these details; issued invoices keep their original address.'
                        : 'Numbering, payment terms and the signature shown on invoice PDFs.'}
                </p>
            </div>
            <form onSubmit={submit} className="space-y-7">
                {Object.values(form.errors).length > 0 && (
                    <BillingFeedback kind="error">
                        {Object.values(form.errors).map((error, i) => (
                            <p key={i}>{error}</p>
                        ))}
                    </BillingFeedback>
                )}
                <fieldset disabled={!canUpdate} className="space-y-7">
                    {section === 'company' && (
                        <section className="bg-card space-y-5 rounded-xl border p-5 sm:p-6">
                            <h2 className="text-lg font-semibold">Company identity</h2>
                            <div className="grid gap-5 sm:grid-cols-2">
                                {identity.map(([key, label]) => (
                                    <div key={key} className="space-y-2">
                                        <Label htmlFor={key}>{label}</Label>
                                        {key === 'phone' ? (
                                            <PhoneInput
                                                id={key}
                                                defaultCountry={form.data.country}
                                                value={form.data.phone}
                                                onChange={(value) => form.setData('phone', value)}
                                                disabled={!canUpdate || form.processing}
                                                aria-invalid={!!form.errors.phone}
                                            />
                                        ) : (
                                            <Input
                                                id={key}
                                                value={form.data[key]}
                                                type={key === 'email' ? 'email' : 'text'}
                                                maxLength={key === 'country' ? 2 : undefined}
                                                onChange={(e) => form.setData(key, e.target.value)}
                                            />
                                        )}
                                        {key === 'country' && <p className="text-muted-foreground text-xs">Two-letter code, such as IN or US.</p>}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <SimpleAssetsField
                                    name="Company logo"
                                    data={logoIds}
                                    readOnly={!canUpdate}
                                    config={{
                                        folder: '/billing',
                                        max_files: 1,
                                        mode: 'grid',
                                        accept: 'image/jpeg,image/png,image/webp',
                                        canEdit: false,
                                    }}
                                    onChange={(assets) => {
                                        const asset = assets[0];
                                        form.setData('logo_media_id', asset ? Number(typeof asset === 'string' ? asset : asset.id) : null);
                                        setLogoError('');
                                    }}
                                    onError={(error) => setLogoError(error)}
                                />
                                <p className="text-muted-foreground text-xs">
                                    Choose a JPEG, PNG or WebP image from your media library. Used in previews and new invoices; imported invoices
                                    without a preserved logo use this image too. It remains protected from deletion while selected.
                                </p>
                                {logoError && <BillingFeedback kind="error">{logoError}</BillingFeedback>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="timezone">Business timezone</Label>
                                <BillingSelect
                                    id="timezone"
                                    value={form.data.timezone}
                                    onValueChange={(value) => form.setData('timezone', value)}
                                    disabled={!canUpdate || form.processing}
                                >
                                    {timezones.map((timezone) => (
                                        <BillingSelectItem key={timezone} value={timezone}>
                                            {timezone}
                                        </BillingSelectItem>
                                    ))}
                                </BillingSelect>
                            </div>
                        </section>
                    )}
                    {section === 'invoices' && (
                        <>
                            <section className="bg-card space-y-4 rounded-xl border p-5 sm:p-6">
                                <div>
                                    <h2 className="text-lg font-semibold">Invoice signature</h2>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Your company’s authorized signature, shown after the invoice terms.
                                    </p>
                                </div>
                                <div className="bg-muted/30 flex items-center justify-between gap-4 rounded-lg border p-4">
                                    <div>
                                        <Label htmlFor="show-signature">Show signature on invoices</Label>
                                        <p className="text-muted-foreground mt-1 text-xs">
                                            Applies to existing invoices and draft previews. Without an image, a blank signing line is shown.
                                        </p>
                                    </div>
                                    <Switch
                                        id="show-signature"
                                        checked={form.data.show_signature_on_invoices}
                                        disabled={!canUpdate}
                                        onCheckedChange={(checked) => form.setData('show_signature_on_invoices', checked)}
                                    />
                                </div>
                                <SimpleAssetsField
                                    name="Signature image"
                                    data={signatureIds}
                                    readOnly={!canUpdate}
                                    config={{
                                        folder: '/billing',
                                        max_files: 1,
                                        mode: 'grid',
                                        accept: 'image/jpeg,image/png,image/webp',
                                        canEdit: false,
                                    }}
                                    onChange={(assets) => {
                                        const asset = assets[0];
                                        form.setData('signature_media_id', asset ? Number(typeof asset === 'string' ? asset : asset.id) : null);
                                        setSignatureError('');
                                    }}
                                    onError={(error) => setSignatureError(error)}
                                />
                                <p className="text-muted-foreground text-xs">
                                    Upload or select a PNG, JPEG or WebP up to 5 MiB. A transparent PNG works best. Remove the selection to use a
                                    blank signing line, then save. Selected images are protected from deletion.
                                </p>
                                {(signatureError || form.errors.signature_media_id || form.errors.show_signature_on_invoices) && (
                                    <BillingFeedback kind="error">
                                        {signatureError || form.errors.signature_media_id || form.errors.show_signature_on_invoices}
                                    </BillingFeedback>
                                )}
                            </section>
                            <section className="bg-card space-y-5 rounded-xl border p-5 sm:p-6">
                                <h2 className="text-lg font-semibold">Invoice defaults</h2>
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="default_currency">Default currency</Label>
                                        <BillingSelect
                                            id="default_currency"
                                            value={form.data.default_currency}
                                            onValueChange={(value) => form.setData('default_currency', value)}
                                            disabled={!canUpdate || form.processing}
                                            placeholder="Choose currency"
                                            allowEmpty
                                        >
                                            {currencies.map((currency) => (
                                                <BillingSelectItem key={currency.code} value={currency.code}>
                                                    {currency.code} — {currency.name}
                                                </BillingSelectItem>
                                            ))}
                                        </BillingSelect>
                                        <p className="text-muted-foreground text-xs">
                                            Select your default currency for new invoices. Existing invoices keep their original currency.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="due_days">Payment due after days</Label>
                                        <Input
                                            id="due_days"
                                            type="number"
                                            min="0"
                                            max="365"
                                            value={form.data.due_days}
                                            onChange={(e) => form.setData('due_days', e.target.value)}
                                            required
                                        />
                                        <p className="text-muted-foreground text-xs">0 means payment is due on the invoice date.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="number_prefix">Invoice number prefix</Label>
                                        <Input
                                            id="number_prefix"
                                            value={form.data.number_prefix}
                                            onChange={(e) => form.setData('number_prefix', e.target.value)}
                                            required
                                            maxLength={20}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="number_padding">Number of digits</Label>
                                        <Input
                                            id="number_padding"
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={form.data.number_padding}
                                            onChange={(e) => form.setData('number_padding', e.target.value)}
                                            required
                                        />
                                        <p className="text-muted-foreground text-xs">
                                            Example: {form.data.number_prefix}
                                            {'1'.padStart(
                                                Number.isFinite(Number(form.data.number_padding))
                                                    ? Math.min(10, Math.max(1, Number(form.data.number_padding)))
                                                    : 1,
                                                '0',
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="default_terms">Default terms</Label>
                                    <Textarea
                                        id="default_terms"
                                        rows={4}
                                        value={form.data.default_terms}
                                        onChange={(e) => form.setData('default_terms', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payment_instructions">Payment instructions</Label>
                                    <Textarea
                                        id="payment_instructions"
                                        rows={4}
                                        value={form.data.payment_instructions}
                                        onChange={(e) => form.setData('payment_instructions', e.target.value)}
                                    />
                                </div>
                            </section>
                        </>
                    )}
                </fieldset>
                {canUpdate && (
                    <Button type="submit" disabled={form.processing}>
                        {form.processing ? 'Saving…' : section === 'company' ? 'Save company settings' : 'Save invoice settings'}
                    </Button>
                )}
            </form>
        </BillingSettingsWorkspace>
    );
}
