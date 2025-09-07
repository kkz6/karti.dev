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
import { Save, Trash2, X } from 'lucide-react';
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
        { title: project.title, href: route('admin.projects.show', project.id) },
        { title: 'Edit', href: route('admin.projects.edit', project.id) },
    ];

    const [activeTab, setActiveTab] = useState('main');
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
        router.put(route('admin.projects.update', project.id), data, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
            router.delete(route('admin.projects.destroy', project.id), {
                onSuccess: () => {
                    // Redirect will be handled by the controller
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Project: ${project.title}`} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                <div className="mx-auto w-full max-w-7xl">
                    {/* Header with Actions */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button type="submit" form="project-form" disabled={form.formState.isSubmitting}>
                                <Save className="mr-2 h-4 w-4" />
                                {form.formState.isSubmitting ? 'Updating...' : 'Update Project'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('admin.projects.show', project.id)}>Cancel</Link>
                            </Button>
                            <Button type="button" variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
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
                                                                    <Input {...field} placeholder="e.g., E-commerce Platform Redesign" />
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
                                                            <FormDescription>Used in URLs.</FormDescription>
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
