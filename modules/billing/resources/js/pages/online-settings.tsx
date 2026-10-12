import { BillingSelect, BillingSelectItem } from '@billing/components/billing-select';
import { BillingSettingsWorkspace } from '@billing/components/billing-settings-workspace';
import { useForm } from '@inertiajs/react';
import InputError from '@shared/components/input-error';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Switch } from '@shared/components/ui/switch';
import { UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import { cn } from '@shared/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type Field = { label: string; type: 'text' | 'password' | 'checkbox'; required?: boolean; value: string | boolean; configured: boolean };
type Provider = { id: string; name: string; enabled: boolean; fields: Record<string, Field>; webhookUrl: string };
type Settings = {
    invoice_checkout_enabled: boolean;
    invoice_product_id: string;
    document_policy_confirmed: boolean;
    default_provider: string;
    enabled_providers: string[];
};
function ProviderCard({
    provider,
    canUpdate,
    onDirtyChange,
}: {
    provider: Provider;
    canUpdate: boolean;
    onDirtyChange: (id: string, dirty: boolean) => void;
}) {
    const form = useForm({
        enabled: provider.enabled,
        fields: Object.fromEntries(Object.entries(provider.fields).map(([key, field]) => [key, field.value])),
    });
    useEffect(() => {
        onDirtyChange(provider.id, form.isDirty && !form.processing);
    }, [provider.id, form.isDirty, form.processing, onDirtyChange]);
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                    {provider.name}
                    {form.isDirty && <Badge variant="outline">Unsaved changes</Badge>}
                </CardTitle>
                <CardDescription>Disabling prevents new checkouts. Existing payments continue to reconcile through this provider.</CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    className="space-y-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.put(route('admin.billing.providers.update', provider.id), {
                            preserveScroll: true,
                            onSuccess: (page) => {
                                const saved = (page.props.providers as Provider[]).find((item) => item.id === provider.id);
                                if (saved) {
                                    const next = {
                                        enabled: saved.enabled,
                                        fields: Object.fromEntries(Object.entries(saved.fields).map(([key, field]) => [key, field.value])),
                                    };
                                    form.setData(next);
                                    form.setDefaults(next);
                                }
                            },
                        });
                    }}
                >
                    <div className="flex items-center justify-between">
                        <Label htmlFor={`${provider.id}-enabled`}>Enable {provider.name}</Label>
                        <Switch
                            id={`${provider.id}-enabled`}
                            checked={form.data.enabled}
                            disabled={!canUpdate || form.processing}
                            onCheckedChange={(enabled) => form.setData('enabled', enabled)}
                        />
                    </div>
                    <InputError message={form.errors.enabled} />
                    {Object.entries(provider.fields).map(([key, field]) => (
                        <div key={key} className="space-y-2">
                            <div
                                className={field.type === 'checkbox' ? 'flex items-center justify-between gap-4 rounded-lg border p-3' : 'space-y-2'}
                            >
                                <Label htmlFor={`${provider.id}-${key}`}>{field.label}</Label>
                                {field.type === 'checkbox' ? (
                                    <Switch
                                        id={`${provider.id}-${key}`}
                                        checked={form.data.fields[key] === true}
                                        disabled={!canUpdate || form.processing}
                                        onCheckedChange={(value) => form.setData('fields', { ...form.data.fields, [key]: value })}
                                    />
                                ) : (
                                    <Input
                                        id={`${provider.id}-${key}`}
                                        type={field.type === 'password' ? 'password' : 'text'}
                                        autoComplete={field.type === 'password' ? 'new-password' : undefined}
                                        value={String(form.data.fields[key] ?? '')}
                                        disabled={!canUpdate || form.processing}
                                        placeholder={
                                            field.type === 'password' && field.configured ? 'Saved credential · leave blank to keep' : undefined
                                        }
                                        onChange={(event) => form.setData('fields', { ...form.data.fields, [key]: event.target.value })}
                                    />
                                )}
                            </div>
                            <InputError message={(form.errors as Record<string, string>)[`fields.${key}`]} />
                        </div>
                    ))}
                    <div className="space-y-2">
                        <Label>Webhook URL</Label>
                        <Input readOnly value={provider.webhookUrl} aria-label={`${provider.name} webhook URL`} />
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(provider.webhookUrl);
                                    toast.success('Webhook URL copied.');
                                } catch {
                                    toast.error('Copy the address from the field instead.');
                                }
                            }}
                        >
                            Copy URL
                        </Button>
                    </div>
                    {canUpdate && (
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving…' : 'Save provider settings'}
                        </Button>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
export default function OnlineSettings({
    settings,
    providers = [],
    canUpdate,
    checkoutAvailable,
}: {
    settings: Settings;
    providers: Provider[];
    canUpdate: boolean;
    checkoutAvailable: boolean;
}) {
    const form = useForm(settings);
    const [providerDirty, setProviderDirty] = useState<Record<string, boolean>>({});
    const onProviderDirtyChange = useCallback((id: string, dirty: boolean) => {
        setProviderDirty((current) => (current[id] === dirty ? current : { ...current, [id]: dirty }));
    }, []);
    const [selectedProvider, setSelectedProvider] = useState(
        () => providers.find((provider) => provider.id === settings.default_provider)?.id ?? providers[0]?.id ?? '',
    );
    const lastSettings = useRef(settings);
    useEffect(() => {
        if (lastSettings.current === settings) return;
        lastSettings.current = settings;
        if (!form.isDirty) {
            form.setData(settings);
            form.setDefaults(settings);
        }
    }, [settings, form]);
    return (
        <BillingSettingsWorkspace section="online">
            <UnsavedChangesGuard dirty={form.isDirty || Object.values(providerDirty).some(Boolean)} />
            <div>
                <h2 className="text-xl font-semibold">Online payments</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                    Choose a provider to configure it. Saved enablement and the default provider remain visible below.
                </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant={checkoutAvailable ? 'default' : 'secondary'}>
                    {checkoutAvailable
                        ? 'Ready for invoice payments'
                        : settings.invoice_checkout_enabled
                          ? 'Checkout setup incomplete'
                          : 'Invoice checkout off'}
                </Badge>
                <span className="text-muted-foreground">
                    {providers.filter((provider) => provider.enabled).length} of {providers.length} providers enabled
                </span>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Invoice checkout</CardTitle>
                    <CardDescription>Choose the default provider and control online payments for customer invoices.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                    <form
                        className="space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            form.put(route('admin.billing.online.update'), { preserveScroll: true, onSuccess: () => form.setDefaults() });
                        }}
                    >
                        <div className="space-y-2">
                            <Label htmlFor="default-provider">Default invoice provider</Label>
                            <BillingSelect
                                id="default-provider"
                                value={form.data.default_provider}
                                placeholder="Enable a provider first"
                                disabled={!canUpdate || form.processing}
                                onValueChange={(value) => form.setData('default_provider', value)}
                            >
                                {providers
                                    .filter((provider) => provider.enabled)
                                    .map((provider) => (
                                        <BillingSelectItem key={provider.id} value={provider.id}>
                                            {provider.name}
                                        </BillingSelectItem>
                                    ))}
                            </BillingSelect>
                            <InputError message={form.errors.default_provider} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="invoice-checkout">Allow online invoice payments</Label>
                            <Switch
                                id="invoice-checkout"
                                checked={form.data.invoice_checkout_enabled}
                                disabled={!canUpdate || form.processing}
                                onCheckedChange={(value) => form.setData('invoice_checkout_enabled', value)}
                            />
                        </div>
                        <InputError message={form.errors.invoice_checkout_enabled} />
                        <div className="flex items-start gap-2">
                            <Checkbox
                                id="document-policy"
                                checked={form.data.document_policy_confirmed}
                                disabled={!canUpdate || form.processing}
                                onCheckedChange={(value) => form.setData('document_policy_confirmed', value === true)}
                            />
                            <Label htmlFor="document-policy" className="leading-relaxed">
                                Provider receipts are payment evidence. This application keeps the issued invoice as the billing document.
                            </Label>
                        </div>
                        <InputError message={form.errors.document_policy_confirmed} />
                        {canUpdate && (
                            <Button type="submit" disabled={form.processing || !providers.length}>
                                Save checkout settings
                            </Button>
                        )}
                    </form>
                </CardContent>
            </Card>
            {providers.length ? (
                <section className="space-y-4" aria-label="Payment providers">
                    <div aria-label="Select payment provider" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {providers.map((provider) => (
                            <button
                                key={provider.id}
                                type="button"
                                id={`provider-tab-${provider.id}`}
                                aria-pressed={selectedProvider === provider.id}
                                aria-controls={`provider-panel-${provider.id}`}
                                onClick={() => setSelectedProvider(provider.id)}
                                className={cn(
                                    'bg-card focus-visible:ring-ring flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                                    selectedProvider === provider.id && 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30',
                                )}
                            >
                                <span className="font-medium">{provider.name}</span>
                                <span className="flex flex-wrap gap-2">
                                    <Badge variant={provider.enabled ? 'default' : 'secondary'}>{provider.enabled ? 'Enabled' : 'Disabled'}</Badge>
                                    {settings.default_provider === provider.id && <Badge variant="outline">Default</Badge>}
                                </span>
                            </button>
                        ))}
                    </div>
                    {providers.map((provider) => (
                        <div
                            key={provider.id}
                            role="region"
                            id={`provider-panel-${provider.id}`}
                            aria-labelledby={`provider-tab-${provider.id}`}
                            hidden={selectedProvider !== provider.id}
                        >
                            <ProviderCard provider={provider} canUpdate={canUpdate} onDirtyChange={onProviderDirtyChange} />
                        </div>
                    ))}
                </section>
            ) : (
                <p className="text-muted-foreground text-sm">
                    No provider packages installed. Install a billing gateway package with Composer to configure online payments.
                </p>
            )}
        </BillingSettingsWorkspace>
    );
}
