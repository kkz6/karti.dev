import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Button } from '@shared/components/ui/button';
import { Calendar } from '@shared/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { FormSimpleEditor } from '@shared/components/tiptap';
import { SimpleAssetsField } from '@media/components/Field/SimpleAssetsField';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { useSlug } from '@shared/hooks/use-slug';
import { CalendarIcon, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@shared/lib/utils';

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
    published_at: z.date().optional(),
});

type ArticleFormData = z.infer<typeof articleSchema>;

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface Tag {
    id: number;
    name: string;
    slug: string;
}

interface Article {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    status: 'draft' | 'published' | 'archived';
    featured_image?: string;
    published_at?: string;
    created_at: string;
    updated_at: string;
    meta_title?: string;
    meta_description?: string;
    category?: Category;
    tags?: Tag[];
}

interface ArticleFormProps {
    article?: Article;
    categories: Category[];
    tags?: Tag[];
}

export default function ArticleForm({ article, categories, tags = [] }: ArticleFormProps) {
    const isEditing = !!article;
    const pageTitle = isEditing ? 'Edit Article' : 'Create Article';
    const submitText = isEditing ? 'Update Article' : 'Create Article';
    const submittingText = isEditing ? 'Updating...' : 'Creating...';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Blog Management', href: route('admin.blog.index') },
        { 
            title: pageTitle, 
            href: isEditing 
                ? route('admin.blog.edit', { blog: article.slug || article.id }) 
                : route('admin.blog.create') 
        },
    ];

    const [activeTab, setActiveTab] = useState('main');
    const { handleTitleChange: handleSlugTitleChange } = useSlug();

    const form = useForm<ArticleFormData>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            title: article?.title || '',
            slug: article?.slug || '',
            content: article?.content || '',
            excerpt: article?.excerpt || '',
            category_id: article?.category?.id.toString() || '',
            tags: article?.tags?.map((tag) => tag.id) || [],
            status: article?.status || 'draft',
            featured_image: article?.featured_image ? [{ url: article.featured_image }] : [],
            meta_title: article?.meta_title || '',
            meta_description: article?.meta_description || '',
            published_at: article?.published_at ? new Date(article.published_at) : undefined,
        },
    });

    const handleTitleChange = (title: string) => {
        handleSlugTitleChange(
            title,
            form.getValues('slug'),
            article?.title,
            (newTitle) => form.setValue('title', newTitle),
            (newSlug) => form.setValue('slug', newSlug)
        );
    };

    const onSubmit = (data: ArticleFormData) => {
        // Format the data for the backend
        const formattedData = {
            ...data,
            published_at: data.published_at ? format(data.published_at, "yyyy-MM-dd HH:mm:ss") : null,
        };

        if (isEditing) {
            router.put(route('admin.blog.update', { blog: article.slug || article.id }), formattedData, {
                preserveState: true,
                preserveScroll: true,
            });
        } else {
            router.post(route('admin.blog.store'), formattedData, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const handleDelete = () => {
        if (!isEditing) return;
        
        if (confirm(`Are you sure you want to delete "${article.title}"?`)) {
            router.delete(route('admin.blog.destroy', { blog: article.slug || article.id }), {
                onSuccess: () => {
                    // Redirect will be handled by the controller
                },
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${pageTitle}: ${article?.title || 'New Article'}`} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                <div className="mx-auto w-full max-w-7xl">
                    {/* Header with Actions */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button type="submit" form="article-form" disabled={form.formState.isSubmitting}>
                                <Save className="mr-2 h-4 w-4" />
                                {form.formState.isSubmitting ? submittingText : submitText}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('admin.blog.index')}>Cancel</Link>
                            </Button>
                            {isEditing && (
                                <Button type="button" variant="destructive" onClick={handleDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            )}
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
                                    <div className="lg:col-span-4 min-w-0">
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
                                                                        folder: 'blog/featured-images'
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
                                            <Card className="w-full">
                                                <CardHeader>
                                                    <CardTitle>Article Content</CardTitle>
                                                    <CardDescription>Write the main content of your article</CardDescription>
                                                </CardHeader>
                                                <CardContent className="w-full overflow-hidden">
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
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel>Publish Date</FormLabel>
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <FormControl>
                                                                        <Button
                                                                            variant="outline"
                                                                            className={cn(
                                                                                "w-full justify-start text-left font-normal",
                                                                                !field.value && "text-muted-foreground"
                                                                            )}
                                                                        >
                                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                                            {field.value ? (
                                                                                format(field.value, "PPP p")
                                                                            ) : (
                                                                                <span>Pick a publish date</span>
                                                                            )}
                                                                        </Button>
                                                                    </FormControl>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar
                                                                        mode="single"
                                                                        selected={field.value}
                                                                        onSelect={field.onChange}
                                                                        initialFocus
                                                                    />
                                                                    {field.value && (
                                                                        <div className="p-3 border-t">
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="w-full"
                                                                                onClick={() => field.onChange(undefined)}
                                                                            >
                                                                                Clear Date
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </PopoverContent>
                                                            </Popover>
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
