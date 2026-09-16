import { Head, useForm, usePage } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import AppLayout from '@shared/layouts/app-layout';
import type { SharedData } from '@shared/types';
import type { SiteSettings } from '@shared/types/site-settings';
import { Check, Save, Settings } from 'lucide-react';
import type { FormEvent } from 'react';

export default function SiteSettingsPage({ settings }: { settings: SiteSettings }) {
    const { ziggy } = usePage<SharedData>().props;
    const form = useForm<SiteSettings>(settings);
    const { data, setData, errors, processing } = form;

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(route('admin.settings.update'), {
            preserveScroll: true,
            onSuccess: (page) => {
                const saved = page.props.settings as SiteSettings;
                form.setData(saved);
                form.setDefaults(saved);
            },
        });
    }

    function field(key: keyof SiteSettings, label: string, help: string, required = false, maxLength = 2048) {
        return (
            <div className="space-y-2">
                <Label htmlFor={`site-${key}`}>
                    {label}
                    {required && ' *'}
                </Label>
                <Input
                    id={`site-${key}`}
                    value={data[key]}
                    onChange={(event) => setData(key, event.target.value)}
                    required={required}
                    maxLength={maxLength}
                    aria-invalid={Boolean(errors[key])}
                    aria-describedby={`site-${key}-help${errors[key] ? ` site-${key}-error` : ''}`}
                />
                <p id={`site-${key}-help`} className="text-muted-foreground text-xs leading-relaxed">
                    {help}
                </p>
                {errors[key] && (
                    <p id={`site-${key}-error`} className="text-destructive text-sm">
                        {errors[key]}
                    </p>
                )}
            </div>
        );
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Site settings', href: route('admin.settings.edit') }]}>
            <Head title="Site settings" />
            <form onSubmit={submit} className="content-index space-y-6">
                <IndexHeader
                    title="Site settings"
                    icon={Settings}
                    actions={
                        <div className="flex items-center gap-3">
                            <span role="status" className="text-muted-foreground text-sm">
                                {form.recentlySuccessful ? (
                                    <span className="flex items-center gap-1.5">
                                        <Check className="size-4" />
                                        Saved
                                    </span>
                                ) : form.isDirty ? (
                                    'Unsaved changes'
                                ) : (
                                    ''
                                )}
                            </span>
                            <Button type="submit" disabled={processing || !form.isDirty}>
                                <Save className="size-4" />
                                {processing ? 'Saving…' : 'Save changes'}
                            </Button>
                        </div>
                    }
                />
                <p className="text-muted-foreground max-w-2xl text-sm">
                    Manage your site identity and search defaults in one place. Individual pages can override the default title, description, and
                    social image.
                </p>
                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
                    <div className="min-w-0 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Site identity</CardTitle>
                                <CardDescription>Used across the admin panel and search previews.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {field('name', 'Site name', 'Your site or brand name, for example karti.dev.', true, 100)}
                                {field('author', 'Default author', 'Used when a page does not specify an author.', true, 100)}
                                {field(
                                    'favicon',
                                    'Favicon',
                                    'Use /favicon.ico, a path from your media library, or an HTTPS image URL. A square icon works best.',
                                    true,
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Search & sharing</CardTitle>
                                <CardDescription>Defaults for your homepage and content without custom metadata.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                {field(
                                    'title',
                                    'Default page title',
                                    'Used on the homepage and when an entry has no title. Page-specific SEO titles are used exactly as entered.',
                                    true,
                                    160,
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="site-description">Default description</Label>
                                    <Textarea
                                        id="site-description"
                                        value={data.description}
                                        rows={4}
                                        maxLength={500}
                                        onChange={(event) => setData('description', event.target.value)}
                                        aria-invalid={Boolean(errors.description)}
                                        aria-describedby={`site-description-help${errors.description ? ' site-description-error' : ''}`}
                                    />
                                    <p id="site-description-help" className="text-muted-foreground text-xs">
                                        {data.description.length} characters · Aim for around 150–160 characters for search results.
                                    </p>
                                    {errors.description && (
                                        <p id="site-description-error" className="text-destructive text-sm">
                                            {errors.description}
                                        </p>
                                    )}
                                </div>
                                {field(
                                    'image',
                                    'Default social image',
                                    'A local media path or HTTPS image URL. Used when no featured image is available; 1200 × 630 is recommended.',
                                )}
                                {field(
                                    'twitter_site',
                                    'X / Twitter handle',
                                    'Include @, or leave empty. Used in social-sharing metadata.',
                                    false,
                                    16,
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <aside className="min-w-0 space-y-4 lg:sticky lg:top-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Search preview</CardTitle>
                                <CardDescription>Updates as you edit. Save to apply it to your site.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-background space-y-3 rounded-md border p-4">
                                    <div className="flex items-center gap-3">
                                        <img src={data.favicon || '/favicon.ico'} alt="" className="size-7 rounded-sm object-contain" />
                                        <div className="min-w-0 text-xs">
                                            <p className="font-medium">{data.name || settings.name}</p>
                                            <p className="text-muted-foreground truncate">{ziggy.url}</p>
                                        </div>
                                    </div>
                                    <p className="text-xl break-words text-blue-600 dark:text-blue-300">{data.title || data.name || settings.name}</p>
                                    <p className="text-muted-foreground text-sm break-words">
                                        {data.description || 'Add a default description for your site.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <p className="text-muted-foreground px-1 text-xs leading-relaxed">
                            Search engines may display a different title or description. These settings provide your preferred defaults.
                        </p>
                    </aside>
                </div>
            </form>
        </AppLayout>
    );
}
