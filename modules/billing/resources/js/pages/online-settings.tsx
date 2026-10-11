import { BillingSettingsWorkspace } from '@billing/components/billing-settings-workspace';
import { useForm } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@shared/components/ui/collapsible';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Switch } from '@shared/components/ui/switch';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { useState } from 'react';
import { BillingFeedback } from '../components/billing-feedback';
export default function OnlineSettings({
    settings,
    apiConfigured,
    webhookConfigured,
    testMode,
    webhookUrl,
    canUpdate,
    message,
}: {
    settings: { invoice_checkout_enabled: boolean; invoice_product_id: string; document_policy_confirmed: boolean };
    apiConfigured: boolean;
    webhookConfigured: boolean;
    testMode: boolean;
    webhookUrl: string;
    canUpdate: boolean;
    message?: string;
}) {
    const form = useForm(settings);
    const [copied, setCopied] = useState(false),
        [copyError, setCopyError] = useState('');
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(webhookUrl);
            setCopied(true);
            setCopyError('');
        } catch {
            setCopyError('Copy the address from the field instead.');
        }
    };
    return (
        <BillingSettingsWorkspace section="online">
            <div className="max-w-2xl space-y-8">
                <header className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold">Online payments</h2>
                        <Badge variant={testMode ? 'warning' : 'info'}>{testMode ? 'Test mode' : 'Live mode'}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">Let customers pay their invoices through Dodo.</p>
                </header>
                {message && <BillingFeedback kind="success">{message}</BillingFeedback>}
                <dl className="grid grid-cols-2 gap-4 border-y py-4">
                    <div className="space-y-2">
                        <dt className="text-muted-foreground text-xs">Provider API</dt>
                        <dd>
                            <Badge variant={apiConfigured ? 'success' : 'warning'}>{apiConfigured ? 'Connected' : 'Not configured'}</Badge>
                        </dd>
                    </div>
                    <div className="space-y-2">
                        <dt className="text-muted-foreground text-xs">Webhook</dt>
                        <dd>
                            <Badge variant={webhookConfigured ? 'success' : 'warning'}>{webhookConfigured ? 'Configured' : 'Not configured'}</Badge>
                        </dd>
                    </div>
                </dl>
                <form
                    className="space-y-6"
                    onSubmit={(event) => {
                        event.preventDefault();
                        form.put(route('admin.billing.online.update'), { preserveScroll: true });
                    }}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="dodo-enabled">Enable invoice online checkout</Label>
                            <p className="text-muted-foreground text-sm">Show a payment option on shared invoices.</p>
                        </div>
                        <Switch
                            id="dodo-enabled"
                            checked={form.data.invoice_checkout_enabled}
                            onCheckedChange={(value) => form.setData('invoice_checkout_enabled', value)}
                            disabled={!canUpdate || form.processing}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dodo-product">Invoice product ID</Label>
                        <Input
                            id="dodo-product"
                            value={form.data.invoice_product_id}
                            onChange={(event) => form.setData('invoice_product_id', event.target.value)}
                            disabled={!canUpdate || form.processing}
                            placeholder="Dodo product ID"
                        />
                        <p className="text-muted-foreground text-xs">Use the product configured for invoice payments.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <Checkbox
                            id="dodo-policy"
                            className="mt-0.5"
                            checked={form.data.document_policy_confirmed}
                            onCheckedChange={(value) => form.setData('document_policy_confirmed', value === true)}
                            disabled={!canUpdate || form.processing}
                        />
                        <Label htmlFor="dodo-policy" className="text-sm leading-5 font-normal">
                            I have reviewed Dodo’s invoice and tax policy for these payments.
                        </Label>
                    </div>
                    <Collapsible>
                        <CollapsibleTrigger asChild>
                            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground -ml-3">
                                Product requirements
                                <ChevronDown className="size-3.5" />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="text-muted-foreground pt-3 text-sm">
                            <p>
                                Dodo is the Merchant of Record. The product must use tax-inclusive pay-what-you-want pricing, no discount, and the
                                invoice currency. Charges must match the quoted balance; mismatches are held for review.
                            </p>
                        </CollapsibleContent>
                    </Collapsible>
                    {Object.values(form.errors).length > 0 && (
                        <BillingFeedback kind="error">
                            {Object.values(form.errors).map((error, index) => (
                                <p key={index}>{error}</p>
                            ))}
                        </BillingFeedback>
                    )}
                    {canUpdate && (
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Saving…' : 'Save online payment settings'}
                        </Button>
                    )}
                </form>
                <section className="space-y-4 border-t pt-6">
                    <div className="space-y-1">
                        <h3 className="font-medium">Provider connection</h3>
                        <p className="text-muted-foreground text-sm">Your API and signing keys are managed in the server settings.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="provider-webhook">Webhook endpoint</Label>
                        <div className="flex min-w-0 gap-2">
                            <Input id="provider-webhook" readOnly value={webhookUrl} className="min-w-0 font-mono text-xs" />
                            <Button type="button" variant="outline" size="icon" aria-label="Copy webhook endpoint" onClick={() => void copy()}>
                                {copied ? <Check /> : <Copy />}
                            </Button>
                        </div>
                        {copied && (
                            <p role="status" className="text-muted-foreground text-xs">
                                Endpoint copied.
                            </p>
                        )}
                        {copyError && (
                            <p role="alert" className="text-destructive text-xs">
                                {copyError}
                            </p>
                        )}
                    </div>
                    <Collapsible>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-muted-foreground -ml-3">
                                Connection details
                                <ChevronDown className="size-3.5" />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="text-muted-foreground pt-3 text-xs">
                            Subscribe to payment.succeeded and refund events. The billing worker and scheduler process notifications and recover
                            interrupted verification.
                        </CollapsibleContent>
                    </Collapsible>
                </section>
            </div>
        </BillingSettingsWorkspace>
    );
}
