import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { SEOFields } from '@seo/components/SeoFields';
import { ContentEditorHeader, EditorErrorSummary, EditorPublishedControl, EditorViewLink } from '@shared/components/content-editor';
import { DateField } from '@shared/components/date-field';
import { LocalTrafficCard } from '@shared/components/local-traffic-card';
import { PageContainer } from '@shared/components/page-container';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import { useAdminTab } from '@shared/hooks/use-admin-tab';
import { useEditorSave } from '@shared/hooks/use-editor-save';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { X } from 'lucide-react';
import type { BaseSyntheticEvent } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Zod schema for project form validation
const projectSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
    slug: z
        .string()
        .min(1, 'Slug is required')
        .max(255, 'Slug must be less than 255 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and contain only letters, numbers, and hyphens'),
    description: z.string().min(1, 'Description is required'),
    short_description: z.string().max(500, 'Short description must be less than 500 characters').nullish(),
    client: z.string().max(255, 'Client name must be less than 255 characters').nullish(),
    project_url: z.string().url('Must be a valid URL').nullish().or(z.literal('')),
    github_url: z.string().url('Must be a valid URL').nullish().or(z.literal('')),
    technologies: z.array(z.string()),
    featured_image: z.string().nullish(),
    images: z.array(z.string()),
    start_date: z.string().nullish(),
    end_date: z.string().nullish(),
    status: z.enum(['draft', 'published', 'archived']),
    featured: z.boolean(),
    meta_title: z.string().max(60, 'Meta title must be less than 60 characters').nullish(),
    meta_description: z.string().max(160, 'Meta description must be less than 160 characters').nullish(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Project {
    id: number;
    title: string;
    slug: string;
    description: string;
    short_description?: string;
    client?: string;
    project_url?: string;
    github_url?: string;
    technologies: string[];
    featured_image?: string;
    images: string[];
    start_date?: string;
    end_date?: string;
    status: 'draft' | 'published' | 'archived';
    featured: boolean;
    meta_title?: string;
    meta_description?: string;
}

export default function Edit({ project }: { project: Project }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: route('admin.projects.index') },
        { title: project.title, href: route('admin.projects.edit', project.slug) },
        { title: 'Edit', href: route('admin.projects.edit', project.slug) },
    ];

    const [activeTab, setActiveTab] = useAdminTab(['main', 'details', 'seo'], 'main');
    const [techInput, setTechInput] = useState('');

    const form = useForm<ProjectFormData>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            title: project.title || '',
            slug: project.slug || '',
            description: project.description || '',
            short_description: project.short_description || '',
            client: project.client || '',
            project_url: project.project_url || '',
            github_url: project.github_url || '',
            technologies: project.technologies || [],
            featured_image: project.featured_image || '',
            images: project.images || [],
            start_date: project.start_date || '',
            end_date: project.end_date || '',
            status: project.status || 'published',
            featured: project.featured || false,
            meta_title: project.meta_title || '',
            meta_description: project.meta_description || '',
        },
    });

    const handleAddTechnology = () => {
        if (techInput.trim()) {
            const currentTech = form.getValues('technologies');
            form.setValue('technologies', [...currentTech, techInput.trim()], { shouldDirty: true });
            setTechInput('');
        }
    };

    const handleRemoveTechnology = (index: number) => {
        const currentTech = form.getValues('technologies');
        form.setValue(
            'technologies',
            currentTech.filter((_, i) => i !== index),
            { shouldDirty: true },
        );
    };

    const { saving, save } = useEditorSave(form, route('admin.projects.index'));

    const onSubmit = (data: ProjectFormData, event?: BaseSyntheticEvent) => {
        save('put', route('admin.projects.update', project.slug), data, event);
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
            router.delete(route('admin.projects.destroy', project.slug), {
                onSuccess: () => {
                    // Redirect will be handled by the controller
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Project: ${project.title}`} />
            <UnsavedChangesGuard dirty={form.formState.isDirty} />
            <PageContainer className="content-editor">
                <div className="w-full">
                    <ContentEditorHeader
                        title={form.watch('title') || 'New project'}
                        status={form.watch('status')}
                        formId="project-form"
                        processing={saving}
                        backHref={route('admin.projects.index')}
                        onArchive={() =>
                            form.setValue('status', form.getValues('status') === 'archived' ? 'draft' : 'archived', { shouldDirty: true })
                        }
                        onDelete={handleDelete}
                    />
                    <EditorErrorSummary errors={form.formState.errors} />

                    <Form {...form}>
                        <form id="project-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                        value="details"
                                        className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        Details
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
                                                    <CardDescription>Update the basic details for the project</CardDescription>
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
                                                                        placeholder="e.g., E-commerce Platform Redesign"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="short_description"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Short Description</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        {...field}
                                                                        value={field.value ?? ''}
                                                                        placeholder="Brief overview of the project..."
                                                                        rows={2}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>A brief summary for project cards</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="description"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Full Description *</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        {...field}
                                                                        value={field.value ?? ''}
                                                                        placeholder="Detailed project description..."
                                                                        rows={6}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="details" className="mt-0 space-y-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Project Details</CardTitle>
                                                    <CardDescription>Additional information about the project</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="client"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Client</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        value={field.value ?? ''}
                                                                        placeholder="Client or company name"
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <FormField
                                                            control={form.control}
                                                            name="start_date"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Start Date</FormLabel>
                                                                    <FormControl>
                                                                        <DateField {...field} label="Start date" />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={form.control}
                                                            name="end_date"
                                                            render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>End Date</FormLabel>
                                                                    <FormControl>
                                                                        <DateField {...field} label="End date" />
                                                                    </FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <FormField
                                                        control={form.control}
                                                        name="project_url"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Project URL</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        value={field.value ?? ''}
                                                                        placeholder="https://example.com"
                                                                        type="url"
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>Live project URL</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="github_url"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>GitHub URL</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        value={field.value ?? ''}
                                                                        placeholder="https://github.com/..."
                                                                        type="url"
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>Source code repository</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <div>
                                                        <FormLabel>Technologies</FormLabel>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={techInput}
                                                                onChange={(e) => setTechInput(e.target.value)}
                                                                placeholder="Add technology..."
                                                                onKeyPress={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        e.preventDefault();
                                                                        handleAddTechnology();
                                                                    }
                                                                }}
                                                            />
                                                            <Button type="button" onClick={handleAddTechnology}>
                                                                Add
                                                            </Button>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {form.watch('technologies').map((tech, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="bg-secondary flex items-center gap-1 rounded-md px-2 py-1 text-sm"
                                                                >
                                                                    {tech}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveTechnology(index)}
                                                                        className="text-muted-foreground hover:text-foreground"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="seo" className="mt-0">
                                            <SEOFields
                                                previewPath="/projects"
                                                metadataOnly
                                                showSlug={false}
                                                data={{
                                                    meta_title: form.watch('meta_title') ?? '',
                                                    meta_description: form.watch('meta_description') ?? '',
                                                    slug: form.watch('slug'),
                                                }}
                                                setData={(key, value) => {
                                                    if ((key === 'meta_title' || key === 'meta_description') && typeof value === 'string')
                                                        form.setValue(key, value, { shouldDirty: true });
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
                                        <EditorViewLink href={route('projects')} published={project.status === 'published'} />
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
                                                            <FormLabel>Project Slug *</FormLabel>
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
                                                                <FormLabel>Featured Project</FormLabel>
                                                                <FormDescription>Display this project prominently</FormDescription>
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
            </PageContainer>
        </AppLayout>
    );
}
