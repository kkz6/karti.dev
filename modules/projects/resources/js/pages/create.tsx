import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { SEOFields } from '@seo/components/SeoFields';
import { seoSchema } from '@seo/types/seo-schema';
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
import { Save, X } from 'lucide-react';
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
    short_description: z.string().max(500, 'Short description must be less than 500 characters').optional(),
    client: z.string().max(255, 'Client name must be less than 255 characters').optional(),
    project_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    github_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    technologies: z.array(z.string()).default([]),
    featured_image: z.string().optional(),
    images: z.array(z.string()).default([]),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']),
    featured: z.boolean(),
    meta_title: z.string().max(60, 'Meta title must be less than 60 characters').optional(),
    meta_description: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
    seo: seoSchema,
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function Create() {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: route('admin.projects.index') },
        { title: 'Create Project', href: route('admin.projects.create') },
    ];

    const [activeTab, setActiveTab] = useState('main');
    const [techInput, setTechInput] = useState('');

    const form = useForm<ProjectFormData>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            title: '',
            slug: '',
            description: '',
            short_description: '',
            client: '',
            project_url: '',
            github_url: '',
            technologies: [],
            featured_image: '',
            images: [],
            start_date: '',
            end_date: '',
            status: 'published',
            featured: false,
            meta_title: '',
            meta_description: '',
            seo: {},
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

    const handleAddTechnology = () => {
        if (techInput.trim()) {
            const currentTech = form.getValues('technologies');
            form.setValue('technologies', [...currentTech, techInput.trim()]);
            setTechInput('');
        }
    };

    const handleRemoveTechnology = (index: number) => {
        const currentTech = form.getValues('technologies');
        form.setValue(
            'technologies',
            currentTech.filter((_, i) => i !== index),
        );
    };

    const onSubmit = (data: ProjectFormData) => {
        router.post(route('admin.projects.store'), data, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Project" />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                <div className="mx-auto w-full max-w-7xl">
                    {/* Header with Actions */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Create Project</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button type="submit" form="project-form" disabled={form.formState.isSubmitting}>
                                <Save className="mr-2 h-4 w-4" />
                                {form.formState.isSubmitting ? 'Creating...' : 'Create Project'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('admin.projects.index')}>Cancel</Link>
                            </Button>
                        </div>
                    </div>

                    <Form {...form}>
                        <form id="project-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                <div className="mt-6 grid gap-8 lg:grid-cols-6">
                                    {/* Left column with tab content - 4/6 */}
                                    <div className="lg:col-span-4">
                                        <TabsContent value="main" className="mt-0 space-y-6">
                                            {/* Basic Information */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Basic Information</CardTitle>
                                                    <CardDescription>Enter the basic details for the project</CardDescription>
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
                                                                    <Textarea {...field} placeholder="Brief overview of the project..." rows={2} />
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
                                                                    <Textarea {...field} placeholder="Detailed project description..." rows={6} />
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
                                                                    <Input {...field} placeholder="Client or company name" />
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
                                                                        <Input {...field} type="date" />
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
                                                                        <Input {...field} type="date" />
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
                                                                    <Input {...field} placeholder="https://example.com" type="url" />
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
                                                                    <Input {...field} placeholder="https://github.com/..." type="url" />
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

                                        <TabsContent value="seo" className="mt-0 space-y-6">
                                            <SEOFields
                                                data={{
                                                    seo: form.watch('seo'),
                                                    meta_title: form.watch('meta_title'),
                                                    meta_description: form.watch('meta_description'),
                                                    slug: form.watch('slug')
                                                }}
                                                setData={(key, value) => {
                                                    if (key === 'seo') {
                                                        form.setValue('seo', value);
                                                    } else {
                                                        form.setValue(key as any, value);
                                                    }
                                                }}
                                                errors={form.formState.errors}
                                                showSlug={false}
                                            />
                                        </TabsContent>
                                    </div>

                                    {/* Right column - fixed - 2/6 */}
                                    <div className="space-y-6 lg:col-span-2">
                                        {/* URL Settings */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>URL Settings</CardTitle>
                                                <CardDescription>Configure the URL for this project</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <FormField
                                                    control={form.control}
                                                    name="slug"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Project Slug *</FormLabel>
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
                                                <CardDescription>Control project visibility</CardDescription>
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
            </div>
        </AppLayout>
    );
}
