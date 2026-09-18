import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { SEOFields } from '@seo/components/SeoFields';
import { ContentEditorHeader, EditorErrorSummary, EditorPublishedControl, EditorViewLink } from '@shared/components/content-editor';
import { DateField } from '@shared/components/date-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { useEditorSave } from '@shared/hooks/use-editor-save';
import AppLayout from '@shared/layouts/app-layout';
import { LocalTrafficCard } from '@shared/components/local-traffic-card';
import { type BreadcrumbItem } from '@shared/types';
import type { BaseSyntheticEvent } from 'react';
import { useAdminTab } from '@shared/hooks/use-admin-tab';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Zod schema for speaking event form validation
const speakingEventSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
    slug: z
        .string()
        .min(1, 'Slug is required')
        .max(255, 'Slug must be less than 255 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and contain only letters, numbers, and hyphens'),
    description: z.string().min(1, 'Description is required'),
    event_name: z.string().min(1, 'Event name is required').max(255, 'Event name must be less than 255 characters'),
    event_date: z.string().nullish(),
    event_type: z.enum(['conference', 'podcast', 'workshop', 'webinar']),
    location: z.string().nullish(),
    url: z.string().url('Must be a valid URL').nullish().or(z.literal('')),
    cta_text: z.string().min(1, 'CTA text is required').max(50, 'CTA text must be less than 50 characters'),
    featured: z.boolean(),
    status: z.enum(['draft', 'published', 'archived']),
    meta_title: z.string().max(60, 'Meta title must be less than 60 characters').nullish(),
    meta_description: z.string().max(160, 'Meta description must be less than 160 characters').nullish(),
});

type SpeakingEventFormData = z.infer<typeof speakingEventSchema>;

interface SpeakingEvent {
    id: number;
    title: string;
    slug: string;
    description: string;
    event_name: string;
    event_date?: string;
    event_type: 'conference' | 'podcast' | 'workshop' | 'webinar';
    location?: string;
    url?: string;
    cta_text: string;
    featured: boolean;
    status: 'draft' | 'published' | 'archived';
    meta_title?: string;
    meta_description?: string;
}

export default function Edit({ event }: { event: SpeakingEvent }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Speaking Events', href: route('admin.speaking.index') },
        { title: event.title, href: route('admin.speaking.edit', event.slug) },
        { title: 'Edit', href: route('admin.speaking.edit', event.slug) },
    ];

    const [activeTab, setActiveTab] = useAdminTab(['main', 'seo'], 'main');

    const form = useForm<SpeakingEventFormData>({
        resolver: zodResolver(speakingEventSchema),
        defaultValues: {
            title: event.title || '',
            slug: event.slug || '',
            description: event.description || '',
            event_name: event.event_name || '',
            event_date: event.event_date || '',
            event_type: event.event_type || 'conference',
            location: event.location || '',
            url: event.url || '',
            cta_text: event.cta_text || 'Watch video',
            featured: event.featured || false,
            status: event.status || 'published',
            meta_title: event.meta_title || '',
            meta_description: event.meta_description || '',
        },
    });

    const { saving, save } = useEditorSave(form, route('admin.speaking.index'));

    const onSubmit = (data: SpeakingEventFormData, submitEvent?: BaseSyntheticEvent) => {
        save('put', route('admin.speaking.update', event.slug), data, submitEvent);
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
            router.delete(route('admin.speaking.destroy', event.slug), {
                onSuccess: () => {
                    // Redirect will be handled by the controller
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Speaking Event: ${event.title}`} />
            <div className="content-editor">
                <div className="w-full">
                    <ContentEditorHeader
                        title={form.watch('title') || 'New speaking event'}
                        status={form.watch('status')}
                        formId="event-form"
                        processing={saving}
                        backHref={route('admin.speaking.index')}
                        onArchive={() =>
                            form.setValue('status', form.getValues('status') === 'archived' ? 'draft' : 'archived', { shouldDirty: true })
                        }
                        onDelete={handleDelete}
                    />
                    <EditorErrorSummary errors={form.formState.errors} />

                    <Form {...form}>
                        <form id="event-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Tabs Header */}
                            <Tabs defaultValue="main" value={activeTab} onValueChange={setActiveTab} className="content-editor-tabs w-full">
                                <TabsList className="border-border text-foreground h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1">
                                    <TabsTrigger
                                        value="main"
                                        className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        Main
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="seo"
                                        className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        SEO
                                    </TabsTrigger>
                                </TabsList>

                                {/* Content Grid */}
                                <div className="content-editor-grid">
                                    {/* Left column with tab content - 4/6 */}
                                    <div className="content-editor-main space-y-6">
                                        <TabsContent value="main" className="mt-0 space-y-6">
                                            {/* Basic Information */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Basic Information</CardTitle>
                                                    <CardDescription>Update the details for the speaking event</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="title"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Title *</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        value={field.value ?? ''}
                                                                        placeholder="e.g., Building scalable applications with React"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="description"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Description *</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        {...field}
                                                                        value={field.value ?? ''}
                                                                        placeholder="Describe your talk or appearance..."
                                                                        rows={4}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <FormField
                                                            control={form.control}
                                                            name="event_name"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Event Name *</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            value={field.value ?? ''}
                                                                            placeholder="e.g., React Summit 2024"
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="event_date"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Event Date</FormLabel>
                                                                    <FormControl>
                                                                        <DateField {...field} label="Event date" />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <FormField
                                                            control={form.control}
                                                            name="event_type"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Event Type *</FormLabel>
                                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                        <FormControl>
                                                                            <SelectTrigger>
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                        </FormControl>
                                                                        <SelectContent>
                                                                            <SelectItem value="conference">Conference</SelectItem>
                                                                            <SelectItem value="podcast">Podcast</SelectItem>
                                                                            <SelectItem value="workshop">Workshop</SelectItem>
                                                                            <SelectItem value="webinar">Webinar</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="location"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Location</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            value={field.value ?? ''}
                                                                            placeholder="e.g., San Francisco, CA"
                                                                        />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <FormField
                                                            control={form.control}
                                                            name="url"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Event URL</FormLabel>
                                                                    <FormControl>
                                                                        <Input
                                                                            {...field}
                                                                            value={field.value ?? ''}
                                                                            placeholder="https://youtube.com/watch?v=..."
                                                                            type="url"
                                                                        />
                                                                    </FormControl>
                                                                    <FormDescription>Link to video, podcast, or event page</FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="cta_text"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>CTA Text *</FormLabel>
                                                                    <FormControl>
                                                                        <Input {...field} value={field.value ?? ''} placeholder="e.g., Watch video" />
                                                                    </FormControl>
                                                                    <FormDescription>Button text for the event link</FormDescription>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="seo" className="mt-0">
                                            <SEOFields
                                                previewPath="/speaking"
                                                metadataOnly
                                                showSlug={false}
                                                data={{
                                                    meta_title: form.watch('meta_title') ?? '',
                                                    meta_description: form.watch('meta_description') ?? '',
                                                    slug: form.watch('slug'),
                                                }}
                                                setData={(key, value) => {
                                                    if ((key === 'meta_title' || key === 'meta_description') && typeof value === 'string')
                                                        form.setValue(key, value);
                                                }}
                                                errors={form.formState.errors}
                                                fallbackTitle={form.watch('title')}
                                                fallbackDescription={form.watch('description')}
                                            />
                                        </TabsContent>
                                    </div>

                                    {/* Right column - fixed - 2/6 */}
                                    <div className="content-editor-aside space-y-6">
                                        <LocalTrafficCard />
                                        <EditorViewLink href={route('speaking')} published={event.status === 'published'} />
                                        <EditorPublishedControl
                                            value={form.watch('status')}
                                            publishedValue="published"
                                            draftValue="draft"
                                            onChange={(value) => form.setValue('status', value, { shouldDirty: true })}
                                            disabled={saving}
                                            error={form.formState.errors.status?.message}
                                        />

                                        {/* URL Settings */}
                                        <Card>
                                            <CardContent className="space-y-6">
                                                <FormField
                                                    control={form.control}
                                                    name="slug"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Event Slug *</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value ?? ''} placeholder="url-friendly-slug" />
                                                            </FormControl>
                                                            <FormDescription>Used in URLs.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="featured"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                                                            <FormControl>
                                                                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel>Featured Event</FormLabel>
                                                                <FormDescription>Display this event prominently</FormDescription>
                                                            </div>
                                                        </FormItem>
                                                    )}
                                                />
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </Tabs>
                        </form>
                    </Form>
                </div>
            </div>
        </AppLayout>
    );
}
