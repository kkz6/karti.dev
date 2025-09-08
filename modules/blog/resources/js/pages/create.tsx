import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { FormSimpleEditor } from '@shared/components/tiptap';
import { SimpleAssetsField } from '@media/components/Field/SimpleAssetsField';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Zod schema for article form validation
const articleSchema = z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
    slug: z
        .string()
        .min(1, 'Slug is required')
        .max(255, 'Slug must be less than 255 characters')
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase and contain only letters, numbers, and hyphens'),
    content: z.string().min(1, 'Content is required'),
    excerpt: z.string().optional(),
    category_id: z.string().min(1, 'Category is required'),
    tags: z.array(z.number()).optional(),
    status: z.enum(['draft', 'published', 'archived']),
    featured_image: z.array(z.any()).optional(),
    meta_title: z.string().max(60, 'Meta title must be less than 60 characters').optional(),
    meta_description: z.string().max(160, 'Meta description must be less than 160 characters').optional(),
    published_at: z.string().optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function Create({ categories }: { categories: Category[]; }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Blog Management', href: route('admin.blog.index') },
        { title: 'Create Article', href: route('admin.blog.create') },
    ];

    const [activeTab, setActiveTab] = useState('main');

    const form = useForm<ArticleFormData>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        category_id: '',
            tags: [],
        status: 'draft',
            featured_image: [],
        meta_title: '',
        meta_description: '',
        published_at: '',
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

    const onSubmit = (data: ArticleFormData) => {
        router.post(route('admin.blog.store'), data, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Article" />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                <div className="mx-auto w-full max-w-7xl">
                    {/* Header with Actions */}
                    <div className="mb-6 flex items-center justify-between">
                    <div>
                            <h1 className="text-3xl font-bold tracking-tight">Create Article</h1>
                    </div>
                        <div className="flex items-center space-x-4">
                            <Button type="submit" form="article-form" disabled={form.formState.isSubmitting}>
                                <Save className="mr-2 h-4 w-4" />
                                {form.formState.isSubmitting ? 'Creating...' : 'Create Article'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('admin.blog.index')}>Cancel</Link>
                        </Button>
                    </div>
                </div>

                    <Form {...form}>
                        <form id="article-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                        value="content"
                                        className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        Content
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
                                                    <CardDescription>Enter the basic details for the article</CardDescription>
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
                                        placeholder="Enter article title"
                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="slug"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Slug *</FormLabel>
                                                                <FormControl>
                                                                    <Input {...field} placeholder="article-slug" />
                                                                </FormControl>
                                                                <FormDescription>Used in URLs. Auto-generated from title.</FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="excerpt"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Excerpt</FormLabel>
                                                                <FormControl>
                                                                    <Textarea {...field} placeholder="Brief description of the article" rows={3} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="featured_image"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <SimpleAssetsField
                                                                    name="Featured Image"
                                                                    data={field.value || []}
                                                                    config={{
                                                                        max_files: 1,
                                                                        mode: 'grid',
                                                                        accept: 'image/*',
                                                                        container: 'public',
                                                                        folder: '/blog/featured-images'
                                                                    }}
                                                                    onChange={(assets) => field.onChange(assets)}
                                                                    onError={(error) => console.error('Asset error:', error)}
                                                                />
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="content" className="mt-0 space-y-6">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Article Content</CardTitle>
                                                    <CardDescription>Write the main content of your article</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <FormField
                                                        control={form.control}
                                                        name="content"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Content *</FormLabel>
                                                                <FormControl>
                                                                    <FormSimpleEditor
                                                                        content={field.value}
                                                                        onChange={field.onChange}
                                                                        placeholder="Write your article content here..."
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
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
                                        {/* Publication Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Publication Settings</CardTitle>
                                                <CardDescription>Control article publication</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name="category_id"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Category *</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                                                </FormControl>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

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
                                                    name="published_at"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Publish Date</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} type="datetime-local" />
                                                            </FormControl>
                                                            <FormDescription>Leave empty to publish immediately</FormDescription>
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
