import { BillingFeedback } from '@billing/components/billing-feedback';
import { BillingSelect, BillingSelectItem } from '@billing/components/billing-select';
import { BillingSettingsWorkspace } from '@billing/components/billing-settings-workspace';
import { useForm } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { PhoneInput } from '@shared/components/ui/phone-input';
import { Switch } from '@shared/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import axios, { AxiosError } from 'axios';
import { Mail, MessageSquare, Save, Send } from 'lucide-react';
import { useState } from 'react';

const events = { invoice: 'Invoice', due: 'Due reminder', overdue: 'Overdue reminder', payment: 'Payment received' };
type Event = keyof typeof events;
type Template = { email_subject: string; email_message: string; sms_message: string };
type Settings = {
    sms_enabled: boolean;
    sms_provider: 'twilio' | 'msg91';
    twilio_account_sid: string;
    twilio_from: string;
    msg91_templates: Record<Event, { id: string; variables: Record<string, string> }>;
    templates: Record<Event, Template>;
};
type Form = Omit<Settings, 'msg91_templates'> & {
    msg91_templates: Record<Event, { id: string; variables: string }>;
    twilio_auth_token: string;
    clear_twilio_auth_token: boolean;
    msg91_auth_key: string;
    clear_msg91_auth_key: boolean;
};
function formData(settings: Settings): Form {
    return {
        ...settings,
        twilio_auth_token: '',
        clear_twilio_auth_token: false,
        msg91_auth_key: '',
        clear_msg91_auth_key: false,
        msg91_templates: Object.fromEntries(
            Object.entries(settings.msg91_templates).map(([event, template]) => [
                event,
                {
                    ...template,
                    variables: Object.entries(template.variables)
                        .map(([key, field]) => `${key}=${field}`)
                        .join('\n'),
                },
            ]),
        ) as Form['msg91_templates'],
    };
}
export default function DeliverySettings({
    settings,
    credentials,
    emailProvider,
    fields,
    canUpdate,
    message,
}: {
    settings: Settings;
    credentials: { twilio: boolean; msg91: boolean };
    emailProvider: string;
    fields: string[];
    canUpdate: boolean;
    message?: string;
}) {
    const form = useForm<Form>(formData(settings));
    const [recipient, setRecipient] = useState('');
    const [testing, setTesting] = useState(false);
    const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
    const disabled = !canUpdate || form.processing;
    const template = (event: Event, key: keyof Template, value: string) =>
        form.setData('templates', {
            ...form.data.templates,
            [event]: { ...form.data.templates[event], [key]: value },
        });
    function save() {
        const mappings: Record<string, Record<string, string>> = {};
        for (const event of Object.keys(events) as Event[]) {
            mappings[event] = {};
            for (const line of form.data.msg91_templates[event].variables.split('\n').filter((line) => line.trim())) {
                const [key, value, extra] = line.split('=').map((part) => part.trim());
                if (!key || !fields.includes(value) || extra !== undefined || Object.hasOwn(mappings[event], key)) {
                    form.setError('msg91_templates', `For ${events[event]}, use one unique VARIABLE=field per line.`);
                    return;
                }
                mappings[event][key] = value;
            }
        }
        form.clearErrors();
        form.transform((data) => ({
            ...data,
            msg91_templates: Object.fromEntries(
                Object.entries(data.msg91_templates).map(([event, value]) => [event, { ...value, variables: mappings[event] }]),
            ),
        }));
        form.put(route('admin.billing.delivery.update'), {
            preserveScroll: true,
            onSuccess: (page) => {
                const saved = formData(page.props.settings as Settings);
                form.setData(saved);
                form.setDefaults(saved);
                setFeedback(null);
            },
        });
    }
    async function test() {
        setTesting(true);
        setFeedback(null);
        try {
            const response = await axios.post<{ message: string }>(route('admin.billing.delivery.test'), { recipient });
            setFeedback({ kind: 'success', message: response.data.message });
        } catch (error) {
            const data = (error as AxiosError<{ message?: string; errors?: { recipient?: string[] } }>).response?.data;
            setFeedback({ kind: 'error', message: data?.errors?.recipient?.[0] ?? data?.message ?? 'The test SMS could not be sent.' });
        } finally {
            setTesting(false);
        }
    }
    return (
        <BillingSettingsWorkspace section="delivery">
            <UnsavedChangesGuard dirty={form.isDirty} />
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold">Delivery</h2>
                    <p className="text-muted-foreground mt-1 text-sm">Email and SMS drivers for invoices, reminders and payment notices.</p>
                </div>
                {canUpdate && (
                    <Button type="submit" form="billing-delivery-settings" disabled={form.processing}>
                        <Save className="size-4" />
                        {form.processing ? 'Saving…' : 'Save changes'}
                    </Button>
                )}
            </div>
            {message && <BillingFeedback kind="success">{message}</BillingFeedback>}
            {Object.values(form.errors).length > 0 && (
                <BillingFeedback kind="error">
                    {Object.values(form.errors).map((error, index) => (
                        <p key={index}>{error}</p>
                    ))}
                </BillingFeedback>
            )}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="size-4" />
                        Email driver
                    </CardTitle>
                    <CardDescription>
                        Current transport: {emailProvider}. Invoice emails include the saved PDF and a private invoice link.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" asChild>
                        <a href={route('admin.settings.email.edit')}>Manage SMTP / Resend</a>
                    </Button>
                </CardContent>
            </Card>
            <form
                id="billing-delivery-settings"
                className="space-y-6"
                onSubmit={(event) => {
                    event.preventDefault();
                    save();
                }}
            >
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between gap-3">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="size-4" />
                                SMS driver
                            </CardTitle>
                            <CardDescription>Choose a provider and save its credentials.</CardDescription>
                        </div>
                        <Switch
                            aria-label="Enable SMS delivery"
                            checked={form.data.sms_enabled}
                            disabled={disabled}
                            onCheckedChange={(value) => form.setData('sms_enabled', value)}
                        />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="sms-provider">Provider</Label>
                            <BillingSelect
                                id="sms-provider"
                                value={form.data.sms_provider}
                                disabled={disabled}
                                onValueChange={(value) => form.setData('sms_provider', value as Settings['sms_provider'])}
                            >
                                <BillingSelectItem value="twilio">Twilio</BillingSelectItem>
                                <BillingSelectItem value="msg91">MSG91</BillingSelectItem>
                            </BillingSelect>
                        </div>
                        {form.data.sms_provider === 'twilio' ? (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="twilio-account">Account SID</Label>
                                        <Input
                                            id="twilio-account"
                                            value={form.data.twilio_account_sid}
                                            disabled={disabled}
                                            onChange={(e) => form.setData('twilio_account_sid', e.target.value)}
                                            placeholder="AC…"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="twilio-from">Sender number or ID</Label>
                                        <Input
                                            id="twilio-from"
                                            value={form.data.twilio_from}
                                            disabled={disabled}
                                            onChange={(e) => form.setData('twilio_from', e.target.value)}
                                            placeholder="+1… or approved sender ID"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="twilio-token">Auth token</Label>
                                    <Input
                                        id="twilio-token"
                                        type="password"
                                        autoComplete="new-password"
                                        value={form.data.twilio_auth_token}
                                        disabled={disabled}
                                        onChange={(e) => form.setData('twilio_auth_token', e.target.value)}
                                        placeholder={credentials.twilio ? 'Saved token · leave blank to keep' : 'Enter auth token'}
                                    />
                                </div>
                                {credentials.twilio && (
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="clear-twilio"
                                            checked={form.data.clear_twilio_auth_token}
                                            disabled={disabled}
                                            onCheckedChange={(v) => form.setData('clear_twilio_auth_token', v === true)}
                                        />
                                        <Label htmlFor="clear-twilio">Remove saved token</Label>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="msg91-key">Auth key</Label>
                                    <Input
                                        id="msg91-key"
                                        type="password"
                                        autoComplete="new-password"
                                        value={form.data.msg91_auth_key}
                                        disabled={disabled}
                                        onChange={(e) => form.setData('msg91_auth_key', e.target.value)}
                                        placeholder={credentials.msg91 ? 'Saved key · leave blank to keep' : 'Enter auth key'}
                                    />
                                </div>
                                {credentials.msg91 && (
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="clear-msg91"
                                            checked={form.data.clear_msg91_auth_key}
                                            disabled={disabled}
                                            onCheckedChange={(v) => form.setData('clear_msg91_auth_key', v === true)}
                                        />
                                        <Label htmlFor="clear-msg91">Remove saved key</Label>
                                    </div>
                                )}
                                <p className="text-muted-foreground text-sm">
                                    MSG91 sends the approved template configured below, using its named variables. The sender and approved content are
                                    managed in MSG91.
                                </p>
                            </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Notification templates</CardTitle>
                        <CardDescription>Choose the notice to edit. Enable automatic reminders and payment receipts under Reminders.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Tabs defaultValue="invoice">
                            <TabsList className="h-auto w-full flex-wrap justify-start">
                                {Object.entries(events).map(([event, label]) => (
                                    <TabsTrigger key={event} value={event}>
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {(Object.keys(events) as Event[]).map((event) => (
                                <TabsContent key={event} value={event} className="space-y-4 pt-3">
                                    <div className="space-y-2">
                                        <Label htmlFor={`${event}-subject`}>Email subject</Label>
                                        <Input
                                            id={`${event}-subject`}
                                            value={form.data.templates[event].email_subject}
                                            disabled={disabled}
                                            onChange={(e) => template(event, 'email_subject', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`${event}-email`}>Email message</Label>
                                        <Textarea
                                            id={`${event}-email`}
                                            value={form.data.templates[event].email_message}
                                            disabled={disabled}
                                            onChange={(e) => template(event, 'email_message', e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor={`${event}-sms`}>
                                            {form.data.sms_provider === 'msg91' ? 'SMS message preview' : 'SMS message'}
                                        </Label>
                                        <Textarea
                                            id={`${event}-sms`}
                                            value={form.data.templates[event].sms_message}
                                            disabled={disabled}
                                            onChange={(e) => template(event, 'sms_message', e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                    {form.data.sms_provider === 'msg91' && (
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor={`${event}-template`}>MSG91 template ID</Label>
                                                <Input
                                                    id={`${event}-template`}
                                                    value={form.data.msg91_templates[event].id}
                                                    disabled={disabled}
                                                    onChange={(e) =>
                                                        form.setData('msg91_templates', {
                                                            ...form.data.msg91_templates,
                                                            [event]: { ...form.data.msg91_templates[event], id: e.target.value },
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor={`${event}-variables`}>MSG91 variable mapping</Label>
                                                <Textarea
                                                    id={`${event}-variables`}
                                                    value={form.data.msg91_templates[event].variables}
                                                    disabled={disabled}
                                                    onChange={(e) =>
                                                        form.setData('msg91_templates', {
                                                            ...form.data.msg91_templates,
                                                            [event]: { ...form.data.msg91_templates[event], variables: e.target.value },
                                                        })
                                                    }
                                                    placeholder={'VAR1=invoice_number\nVAR2=amount_due\nVAR3=invoice_link'}
                                                />
                                                <p className="text-muted-foreground text-xs">One exact provider variable name and field per line.</p>
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            ))}
                        </Tabs>
                        <div className="bg-muted/40 rounded-lg border p-3">
                            <p className="mb-2 text-xs font-medium">Available fields</p>
                            <div className="flex flex-wrap gap-1.5">
                                {fields.map((field) => (
                                    <code key={field} className="bg-background rounded border px-1.5 py-0.5 text-xs">{`{${field}}`}</code>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>
            {canUpdate && (
                <Card>
                    <CardHeader>
                        <CardTitle>Test SMS delivery</CardTitle>
                        <CardDescription>Sends one test using the saved invoice template. Save changes before testing.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="min-w-0 flex-1 space-y-2">
                                <Label htmlFor="test-sms-recipient">Recipient</Label>
                                <PhoneInput
                                    id="test-sms-recipient"
                                    value={recipient}
                                    onChange={setRecipient}
                                    defaultCountry="IN"
                                    disabled={testing}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={test}
                                disabled={testing || form.processing || form.isDirty || !settings.sms_enabled || !recipient}
                            >
                                <Send className="size-4" />
                                {testing ? 'Sending…' : 'Send test SMS'}
                            </Button>
                        </div>
                        {feedback && <BillingFeedback kind={feedback.kind}>{feedback.message}</BillingFeedback>}
                    </CardContent>
                </Card>
            )}
        </BillingSettingsWorkspace>
    );
}
