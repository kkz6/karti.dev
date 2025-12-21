import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { SEOFields } from '@seo/components/SeoFields';
import { seoSchema, type SeoData } from '@seo/types/seo-schema';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { useSlug } from '@shared/hooks/use-slug';
import { Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Zod schema for category form validation
const categorySchema = z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
    slug: z
        .string()
        .min(1, 'Slug is required')
        .max(255, 'Slug must be less than 255 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and contain only letters, numbers, and hyphens'),
    description: z.string().nullish(),
    meta_title: z.string().max(60, 'Meta title must be less than 60 characters').nullish(),
    meta_description: z.string().max(160, 'Meta description must be less than 160 characters').nullish(),
    seo: seoSchema,
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    meta_title?: string;
    meta_description?: string;
    seo?: SeoData;
}

export default function Edit({ category }: { category: Category }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Blog Management', href: route('admin.blog.index') },
        { title: 'Categories', href: route('admin.categories.index') },
        { title: category.name, href: route('admin.categories.edit', { category: category.slug || category.id }) },
    ];

    const [activeTab, setActiveTab] = useState('main');
    const { handleTitleChange } = useSlug();

    const form = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: category.name || '',
            slug: category.slug || '',
            description: category.description || '',
            meta_title: category.meta_title || '',
            meta_description: category.meta_description || '',
            seo: category.seo || {},
        },
    });

    const handleNameChange = (name: string) => {
        handleTitleChange(
            name,
            form.getValues('slug'),
            category.name,
            (title) => form.setValue('name', title),
            (slug) => form.setValue('slug', slug)
        );
    };

    const onSubmit = (data: CategoryFormData) => {
        router.put(route('admin.categories.update', { category: category.slug || category.id }), data, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            router.delete(route('admin.categories.destroy', { category: category.slug || category.id }), {
                onSuccess: () => {
                    // Redirect will be handled by the controller
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Category: ${category.name}`} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                <div className="mx-auto w-full max-w-7xl">
                    {/* Header with Actions */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button type="submit" form="category-form" disabled={form.formState.isSubmitting}>
                                <Save className="mr-2 h-4 w-4" />
                                {form.formState.isSubmitting ? 'Updating...' : 'Update Category'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('admin.categories.index')}>Cancel</Link>
                            </Button>
                            <Button type="button" variant="destructive" onClick={handleDelete}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    </div>

                    <Form {...form}>
                        <form id="category-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                                    <CardDescription>Update the basic details for the category</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="name"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Name *</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        {...field}
                                                                        onChange={(e) => handleNameChange(e.target.value)}
                                                                        placeholder="Enter category name"
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
                                                                <FormLabel>Description</FormLabel>
                                                                <FormControl>
                                                                    <Textarea {...field} placeholder="Describe this category..." rows={3} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
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
                                    <div className="lg:col-span-2">
                                        {/* URL Settings */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>URL Settings</CardTitle>
                                                <CardDescription>Configure the URL for this category</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <FormField
                                                    control={form.control}
                                                    name="slug"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Category Slug *</FormLabel>
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
