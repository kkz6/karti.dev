import { Head, useForm } from '@inertiajs/react';
import InputError from '@shared/components/input-error';
import { SettingsWorkspace } from '@shared/components/settings-workspace';
import { siteSettingsSections } from '@shared/components/site-settings-tabs';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Switch } from '@shared/components/ui/switch';
import { UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import AppLayout from '@shared/layouts/app-layout';
import { Save, Settings } from 'lucide-react';
import type { FormEvent } from 'react';

type Protection = { enabled: boolean; site_key: string };

export default function ProtectionSettings({
    settings,
    secretConfigured,
    status,
}: {
    settings: Protection;
    secretConfigured: boolean;
    status: 'active' | 'disabled' | 'incomplete';
}) {
    const form = useForm({ ...settings, secret_key: '', clear_secret_key: false });
    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(route('admin.settings.protection.update'), {
            preserveScroll: true,
            onSuccess: (page) => {
                const saved = { ...(page.props.settings as Protection), secret_key: '', clear_secret_key: false };
                form.setData(saved);
                form.setDefaults(saved);
            },
        });
    }
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Site settings', href: route('admin.settings.edit') },
                { title: 'Spam protection', href: route('admin.settings.protection.edit') },
            ]}
        >
            <Head title="Spam protection" />
            <UnsavedChangesGuard dirty={form.isDirty} />
            <SettingsWorkspace
                title="Site settings"
                icon={Settings}
                sections={siteSettingsSections()}
                selected="protection"
                formId="spam-protection-form"
                onSubmit={submit}
                actions={
                    <Button type="submit" form="spam-protection-form" disabled={form.processing || !form.isDirty}>
                        <Save className="size-4" />
                        {form.processing ? 'Saving…' : 'Save changes'}
                    </Button>
                }
            >
                <p className="text-muted-foreground text-sm">Manage bot protection for your public contact form.</p>
                <Card>
                    <CardHeader>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <CardTitle>Cloudflare Turnstile</CardTitle>
                            <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                                {status === 'active' ? 'Enabled · Keys configured' : status === 'incomplete' ? 'Keys required' : 'Disabled'}
                            </Badge>
                        </div>
                        <CardDescription>
                            Saved status shown above. Keys are checked by Cloudflare when visitors submit the contact form.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                            <div>
                                <Label htmlFor="turnstile-enabled">Enable Turnstile</Label>
                                <p className="text-muted-foreground mt-1 text-xs">Require server verification for public contact messages.</p>
                            </div>
                            <Switch
                                id="turnstile-enabled"
                                checked={form.data.enabled}
                                disabled={form.processing}
                                onCheckedChange={(enabled) => form.setData('enabled', enabled)}
                            />
                        </div>
                        <InputError message={form.errors.enabled} />
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="turnstile-site-key">Site key</Label>
                                <Input
                                    id="turnstile-site-key"
                                    value={form.data.site_key}
                                    disabled={form.processing}
                                    onChange={(event) => form.setData('site_key', event.target.value)}
                                    aria-invalid={!!form.errors.site_key}
                                />
                                <InputError message={form.errors.site_key} />
                                <p className="text-muted-foreground text-xs">Public key for your contact-form widget.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="turnstile-secret">Secret key</Label>
                                <Input
                                    id="turnstile-secret"
                                    type="password"
                                    autoComplete="new-password"
                                    value={form.data.secret_key}
                                    disabled={form.processing}
                                    placeholder={secretConfigured ? 'Saved secret · leave blank to keep' : 'Enter secret key'}
                                    onChange={(event) => form.setData('secret_key', event.target.value)}
                                    aria-invalid={!!form.errors.secret_key}
                                />
                                <InputError message={form.errors.secret_key} />
                                <p className="text-muted-foreground text-xs">Encrypted and never shown after saving.</p>
                            </div>
                        </div>
                        {secretConfigured && (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="clear-turnstile-secret"
                                    checked={form.data.clear_secret_key}
                                    disabled={form.processing}
                                    onCheckedChange={(value) => form.setData('clear_secret_key', value === true)}
                                />
                                <Label htmlFor="clear-turnstile-secret">Remove saved secret</Label>
                            </div>
                        )}
                        <p className="text-muted-foreground text-sm">
                            Create a Turnstile widget in your Cloudflare dashboard and allow the domains used by your site. Add both keys before
                            enabling.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Additional protection</CardTitle>
                        <CardDescription>These protections remain active whether Turnstile is enabled or disabled.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                        <Badge variant="outline">Rate limiting active</Badge>
                        <Badge variant="outline">Hidden spam trap active</Badge>
                    </CardContent>
                </Card>
            </SettingsWorkspace>
        </AppLayout>
    );
}
