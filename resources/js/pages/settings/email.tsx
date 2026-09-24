import { Head, useForm } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import InputError from '@shared/components/input-error';
import { PageContainer } from '@shared/components/page-container';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Switch } from '@shared/components/ui/switch';
import { UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import AppLayout from '@shared/layouts/app-layout';
import axios, { AxiosError } from 'axios';
import { Check, CircleCheck, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, Mail, Save, Send, Server, TriangleAlert } from 'lucide-react';
import { type FormEvent, useState } from 'react';

type EmailSettings = {
    enabled: boolean;
    provider: 'smtp' | 'resend';
    host: string;
    port: number;
    username: string;
    encryption: 'tls' | 'ssl';
    from_address: string;
    from_name: string;
};

type EmailSettingsForm = EmailSettings & {
    password: string;
    clear_password: boolean;
    resend_api_key: string;
    clear_resend_api_key: boolean;
};

type EmailSettingsPageProps = {
    emailSettings: EmailSettings;
    passwordConfigured: boolean;
    apiKeyConfigured: boolean;
    environmentMailer: string;
    testRecipient: string;
};

type TestStatus = { type: 'success' | 'error'; message: string } | null;

export default function EmailSettingsPage({
    emailSettings,
    passwordConfigured,
    apiKeyConfigured,
    environmentMailer,
    testRecipient: initialTestRecipient,
}: EmailSettingsPageProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [testRecipient, setTestRecipient] = useState(initialTestRecipient);
    const [testing, setTesting] = useState(false);
    const [testStatus, setTestStatus] = useState<TestStatus>(null);
    const form = useForm<EmailSettingsForm>({
        ...emailSettings,
        password: '',
        clear_password: false,
        resend_api_key: '',
        clear_resend_api_key: false,
    });
    const { data, setData, errors, processing } = form;

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(route('admin.settings.email.update'), {
            preserveScroll: true,
            onSuccess: (page) => {
                const saved = page.props.emailSettings as EmailSettings;
                const next = {
                    ...saved,
                    password: '',
                    clear_password: false,
                    resend_api_key: '',
                    clear_resend_api_key: false,
                };
                form.setData(next);
                form.setDefaults(next);
                setTestStatus(null);
            },
        });
    }

    async function sendTestEmail() {
        setTesting(true);
        setTestStatus(null);

        try {
            const response = await axios.post<{ message: string }>(route('admin.settings.email.test'), {
                recipient: testRecipient,
            });
            setTestStatus({ type: 'success', message: response.data.message });
        } catch (error) {
            const response = (error as AxiosError<{ message?: string; errors?: { recipient?: string[] } }>).response?.data;
            setTestStatus({
                type: 'error',
                message: response?.errors?.recipient?.[0] ?? response?.message ?? 'The test email could not be sent. Please try again.',
            });
        } finally {
            setTesting(false);
        }
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Email settings', href: route('admin.settings.email.edit') }]}>
            <Head title="Email settings" />
            <UnsavedChangesGuard dirty={form.isDirty} />
            <PageContainer as="form" onSubmit={submit} className="content-index space-y-6">
                <IndexHeader
                    title="Email settings"
                    icon={Mail}
                    actions={
                        <div className="flex items-center gap-3">
                            <span role="status" className="text-muted-foreground text-sm">
                                {form.recentlySuccessful ? (
                                    <span className="flex items-center gap-1.5">
                                        <Check className="size-4" aria-hidden="true" />
                                        Saved
                                    </span>
                                ) : form.isDirty ? (
                                    'Unsaved changes'
                                ) : (
                                    ''
                                )}
                            </span>
                            <Button type="submit" disabled={processing || !form.isDirty}>
                                <Save className="size-4" aria-hidden="true" />
                                {processing ? 'Saving…' : 'Save changes'}
                            </Button>
                        </div>
                    }
                />

                <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                    Choose SMTP or Resend for newsletter confirmations, password resets, and other application email. Saved credentials override the
                    server environment only when custom delivery is enabled.
                </p>

                <div className="max-w-4xl space-y-6">
                    <Card>
                        <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <Label htmlFor="email-settings-enabled" className="text-base font-semibold">
                                    Use a custom email provider
                                </Label>
                                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                                    {data.enabled
                                        ? `Outgoing email uses the saved ${data.provider === 'resend' ? 'Resend' : 'SMTP'} configuration below.`
                                        : `Outgoing email continues to use the ${environmentMailer} mailer configured on the server.`}
                                </p>
                            </div>
                            <Switch
                                id="email-settings-enabled"
                                checked={data.enabled}
                                onCheckedChange={(checked) => setData('enabled', checked)}
                                aria-describedby="email-settings-mode"
                            />
                            <span id="email-settings-mode" className="sr-only">
                                {data.enabled ? 'Custom email delivery enabled' : 'Server environment delivery enabled'}
                            </span>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-start gap-3">
                                <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                                    <Server className="size-4" aria-hidden="true" />
                                </div>
                                <div>
                                    <CardTitle>Delivery provider</CardTitle>
                                    <CardDescription className="mt-1">Choose how the application sends transactional email.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="max-w-sm space-y-2">
                                <Label htmlFor="email-provider">Provider</Label>
                                <Select value={data.provider} onValueChange={(value: 'smtp' | 'resend') => setData('provider', value)}>
                                    <SelectTrigger id="email-provider" aria-invalid={Boolean(errors.provider)}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="smtp">SMTP server</SelectItem>
                                        <SelectItem value="resend">Resend API</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.provider} />
                            </div>
                        </CardContent>
                    </Card>

                    {data.provider === 'smtp' ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-start gap-3">
                                    <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                                        <Server className="size-4" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <CardTitle>SMTP server</CardTitle>
                                        <CardDescription className="mt-1">Connection details supplied by your SMTP provider.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="email-host">SMTP host</Label>
                                    <Input
                                        id="email-host"
                                        value={data.host}
                                        onChange={(event) => setData('host', event.target.value)}
                                        placeholder="smtp.example.com"
                                        autoComplete="off"
                                        aria-invalid={Boolean(errors.host)}
                                        aria-describedby="email-host-help email-host-error"
                                    />
                                    <p id="email-host-help" className="text-muted-foreground text-xs">
                                        Enter the host only, without http:// or https://.
                                    </p>
                                    <InputError id="email-host-error" message={errors.host} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email-port">Port</Label>
                                    <Input
                                        id="email-port"
                                        type="number"
                                        min={1}
                                        max={65535}
                                        value={data.port}
                                        onChange={(event) => setData('port', Number(event.target.value))}
                                        inputMode="numeric"
                                        aria-invalid={Boolean(errors.port)}
                                        aria-describedby="email-port-error"
                                    />
                                    <InputError id="email-port-error" message={errors.port} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email-encryption">Connection security</Label>
                                    <Select value={data.encryption} onValueChange={(value: 'tls' | 'ssl') => setData('encryption', value)}>
                                        <SelectTrigger id="email-encryption" aria-invalid={Boolean(errors.encryption)}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tls">STARTTLS / automatic</SelectItem>
                                            <SelectItem value="ssl">Implicit TLS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.encryption} />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="email-username">Username</Label>
                                    <Input
                                        id="email-username"
                                        value={data.username}
                                        onChange={(event) => setData('username', event.target.value)}
                                        autoComplete="username"
                                        placeholder="SMTP username"
                                        aria-invalid={Boolean(errors.username)}
                                        aria-describedby="email-username-help email-username-error"
                                    />
                                    <p id="email-username-help" className="text-muted-foreground text-xs">
                                        Leave empty only when your SMTP server does not require authentication.
                                    </p>
                                    <InputError id="email-username-error" message={errors.username} />
                                </div>

                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="email-password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="email-password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(event) => {
                                                setData('password', event.target.value);
                                                if (event.target.value) setData('clear_password', false);
                                            }}
                                            autoComplete="new-password"
                                            placeholder={passwordConfigured ? 'Saved password — enter a new one to replace it' : 'SMTP password'}
                                            className="pr-11"
                                            aria-invalid={Boolean(errors.password)}
                                            aria-describedby="email-password-help email-password-error"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((visible) => !visible)}
                                            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md focus-visible:ring-2 focus-visible:outline-none"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-4" aria-hidden="true" />
                                            ) : (
                                                <Eye className="size-4" aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>
                                    <p id="email-password-help" className="text-muted-foreground flex items-center gap-1.5 text-xs leading-relaxed">
                                        <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
                                        {passwordConfigured
                                            ? 'A password is saved securely. Leave this field empty to keep it unchanged.'
                                            : 'The password is encrypted before it is stored and is never displayed again.'}
                                    </p>
                                    <InputError id="email-password-error" message={errors.password} />
                                    {passwordConfigured ? (
                                        <div className="flex items-center gap-2 pt-1">
                                            <Checkbox
                                                id="email-clear-password"
                                                checked={data.clear_password}
                                                onCheckedChange={(checked) => {
                                                    setData('clear_password', checked === true);
                                                    if (checked) setData('password', '');
                                                }}
                                            />
                                            <Label htmlFor="email-clear-password" className="text-sm font-normal">
                                                Remove the saved password
                                            </Label>
                                        </div>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <div className="flex items-start gap-3">
                                    <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                                        <KeyRound className="size-4" aria-hidden="true" />
                                    </div>
                                    <div>
                                        <CardTitle>Resend API</CardTitle>
                                        <CardDescription className="mt-1">Create an API key in Resend with permission to send email.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="max-w-xl space-y-2">
                                    <Label htmlFor="email-resend-api-key">API key</Label>
                                    <div className="relative">
                                        <Input
                                            id="email-resend-api-key"
                                            type={showApiKey ? 'text' : 'password'}
                                            value={data.resend_api_key}
                                            onChange={(event) => {
                                                setData('resend_api_key', event.target.value);
                                                if (event.target.value) setData('clear_resend_api_key', false);
                                            }}
                                            autoComplete="new-password"
                                            placeholder={apiKeyConfigured ? 'Saved API key — enter a new one to replace it' : 're_…'}
                                            className="pr-11"
                                            aria-invalid={Boolean(errors.resend_api_key)}
                                            aria-describedby="email-resend-api-key-help email-resend-api-key-error"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey((visible) => !visible)}
                                            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md focus-visible:ring-2 focus-visible:outline-none"
                                            aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
                                        >
                                            {showApiKey ? (
                                                <EyeOff className="size-4" aria-hidden="true" />
                                            ) : (
                                                <Eye className="size-4" aria-hidden="true" />
                                            )}
                                        </button>
                                    </div>
                                    <p
                                        id="email-resend-api-key-help"
                                        className="text-muted-foreground flex items-center gap-1.5 text-xs leading-relaxed"
                                    >
                                        <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
                                        {apiKeyConfigured
                                            ? 'An API key is saved securely. Leave this field empty to keep it unchanged.'
                                            : 'The API key is encrypted before it is stored and is never displayed again.'}
                                    </p>
                                    <InputError id="email-resend-api-key-error" message={errors.resend_api_key} />
                                    {apiKeyConfigured ? (
                                        <div className="flex items-center gap-2 pt-1">
                                            <Checkbox
                                                id="email-clear-resend-api-key"
                                                checked={data.clear_resend_api_key}
                                                onCheckedChange={(checked) => {
                                                    setData('clear_resend_api_key', checked === true);
                                                    if (checked) setData('resend_api_key', '');
                                                }}
                                            />
                                            <Label htmlFor="email-clear-resend-api-key" className="text-sm font-normal">
                                                Remove the saved API key
                                            </Label>
                                        </div>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Sender identity</CardTitle>
                            <CardDescription>This name and address appear in the From field of outgoing email.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="email-from-name">From name</Label>
                                <Input
                                    id="email-from-name"
                                    value={data.from_name}
                                    onChange={(event) => setData('from_name', event.target.value)}
                                    placeholder="Your site name"
                                    autoComplete="organization"
                                    aria-invalid={Boolean(errors.from_name)}
                                    aria-describedby="email-from-name-error"
                                />
                                <InputError id="email-from-name-error" message={errors.from_name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email-from-address">From address</Label>
                                <Input
                                    id="email-from-address"
                                    type="email"
                                    value={data.from_address}
                                    onChange={(event) => setData('from_address', event.target.value)}
                                    placeholder="hi@karti.dev"
                                    autoComplete="email"
                                    aria-invalid={Boolean(errors.from_address)}
                                    aria-describedby="email-from-address-help email-from-address-error"
                                />
                                <p id="email-from-address-help" className="text-muted-foreground text-xs">
                                    Use an address verified by your email provider.
                                </p>
                                <InputError id="email-from-address-error" message={errors.from_address} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-start gap-3">
                                <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
                                    <Send className="size-4" aria-hidden="true" />
                                </div>
                                <div>
                                    <CardTitle>Test delivery</CardTitle>
                                    <CardDescription className="mt-1">
                                        Send a real email through the saved provider to confirm the credentials and verified sender work.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end">
                                <div className="min-w-0 flex-1 space-y-2">
                                    <Label htmlFor="email-test-recipient">Send test to</Label>
                                    <Input
                                        id="email-test-recipient"
                                        type="email"
                                        value={testRecipient}
                                        onChange={(event) => {
                                            setTestRecipient(event.target.value);
                                            setTestStatus(null);
                                        }}
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={sendTestEmail}
                                    disabled={testing || form.isDirty || !data.enabled || testRecipient.trim() === ''}
                                >
                                    {testing ? (
                                        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                                    ) : (
                                        <Send className="size-4" aria-hidden="true" />
                                    )}
                                    {testing ? 'Sending…' : 'Send test email'}
                                </Button>
                            </div>

                            {form.isDirty ? (
                                <p className="text-muted-foreground text-xs">
                                    Save your changes before testing so the message uses exactly what is stored.
                                </p>
                            ) : !data.enabled ? (
                                <p className="text-muted-foreground text-xs">Enable custom email delivery before sending a test.</p>
                            ) : null}

                            {testStatus ? (
                                <div
                                    role="status"
                                    className={
                                        testStatus.type === 'success'
                                            ? 'flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-400'
                                            : 'text-destructive flex items-start gap-2 text-sm'
                                    }
                                >
                                    {testStatus.type === 'success' ? (
                                        <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    ) : (
                                        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                    )}
                                    <span>{testStatus.message}</span>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </PageContainer>
        </AppLayout>
    );
}
