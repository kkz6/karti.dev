import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { Save } from 'lucide-react';
import { useState } from 'react';
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
    event_date: z.string().optional(),
    event_type: z.enum(['conference', 'podcast', 'workshop', 'webinar']),
    location: z.string().optional(),
    url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    cta_text: z.string().min(1, 'CTA text is required').max(50, 'CTA text must be less than 50 characters'),
    featured: z.boolean(),
    status: z.enum(['draft', 'published', 'archived']),
    meta_title: z.string().max(60, 'Meta title must be less than 60 characters').optional(),
    meta_description: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
});

type SpeakingEventFormData = z.infer<typeof speakingEventSchema>;

export default function Create() {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Speaking Events', href: route('admin.speaking.index') },
        { title: 'Create Event', href: route('admin.speaking.create') },
    ];

    const [activeTab, setActiveTab] = useState('main');

    const form = useForm<SpeakingEventFormData>({
        resolver: zodResolver(speakingEventSchema),
        defaultValues: {
            title: '',
            slug: '',
            description: '',
            event_name: '',
            event_date: '',
            event_type: 'conference',
            location: '',
            url: '',
            cta_text: 'Watch video',
            featured: false,
            status: 'published',
            meta_title: '',
            meta_description: '',
        },
    });

    const handleTitleChange = (title: string) => {
        form.setValue('title', title);
        // Auto-generate slug from title
        const currentSlug = form.getValues('slug');
        if (!currentSlug || currentSlug === generateSlug(form.watch('title'))) {
            form.setValue('slug', generateSlug(title));
        }
    };

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const onSubmit = (data: SpeakingEventFormData) => {
        router.post(route('admin.speaking.store'), data, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Update CTA text based on event type
    const handleEventTypeChange = (value: string) => {
        form.setValue('event_type', value as any);

        // Set default CTA text based on event type
        const defaultCTAs: Record<string, string> = {
            conference: 'Watch video',
            podcast: 'Listen to podcast',
            workshop: 'View materials',
            webinar: 'Watch recording',
        };

        form.setValue('cta_text', defaultCTAs[value] || 'Learn more');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Speaking Event" />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                <div className="mx-auto w-full max-w-7xl">
                    {/* Header with Actions */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Create Speaking Event</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button type="submit" form="event-form" disabled={form.formState.isSubmitting}>
                                <Save className="mr-2 h-4 w-4" />
                                {form.formState.isSubmitting ? 'Creating...' : 'Create Event'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('admin.speaking.index')}>Cancel</Link>
                            </Button>
                        </div>
                    </div>

                    <Form {...form}>
                        <form id="event-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            {/* Tabs Header */}
                            <Tabs defaultValue="main" value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                                <div className="mt-6 grid gap-8 lg:grid-cols-6">
                                    {/* Left column with tab content - 4/6 */}
                                    <div className="lg:col-span-4">
                                        <TabsContent value="main" className="mt-0 space-y-6">
                                            {/* Basic Information */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Basic Information</CardTitle>
                                                    <CardDescription>Enter the details for the speaking event</CardDescription>
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
                                                                        onChange={(e) => handleTitleChange(e.target.value)}
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
                                                                    <Textarea {...field} placeholder="Describe your talk or appearance..." rows={4} />
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
                                                                        <Input {...field} placeholder="e.g., React Summit 2024" />
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
                                                                        <Input {...field} type="date" />
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
                                                                    <Select onValueChange={handleEventTypeChange} defaultValue={field.value}>
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
                                                                        <Input {...field} placeholder="e.g., San Francisco, CA" />
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
                                                                        <Input {...field} placeholder="https://youtube.com/watch?v=..." type="url" />
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
                                                                        <Input {...field} placeholder="e.g., Watch video" />
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

                                        <TabsContent value="seo" className="mt-0 space-y-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>SEO Settings</CardTitle>
                                                    <CardDescription>Optimize your content for search engines</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="meta_title"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Meta Title</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} placeholder="SEO title for search engines" maxLength={60} />
                                                                </FormControl>
                                                                <FormDescription>{(field.value || '').length}/60 characters</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="meta_description"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Meta Description</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        {...field}
                                                                        placeholder="Brief description for search engine results"
                                                                        rows={3}
                                                                        maxLength={160}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>{(field.value || '').length}/160 characters</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </div>

                                    {/* Right column - fixed - 2/6 */}
                                    <div className="space-y-6 lg:col-span-2">
                                        {/* URL Settings */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>URL Settings</CardTitle>
                                                <CardDescription>Configure the URL for this event</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <FormField
                                                    control={form.control}
                                                    name="slug"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Event Slug *</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} placeholder="url-friendly-slug" />
                                                            </FormControl>
                                                            <FormDescription>Used in URLs. Auto-generated from title.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </CardContent>
                                        </Card>

                                        {/* Publishing Options */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Publishing Options</CardTitle>
                                                <CardDescription>Control event visibility</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name="status"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Status</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="draft">Draft</SelectItem>
                                                                    <SelectItem value="published">Published</SelectItem>
                                                                    <SelectItem value="archived">Archived</SelectItem>
                                                                </SelectContent>
                                                            </Select>
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
