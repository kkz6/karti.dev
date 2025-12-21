import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { articleSchema, type ArticleFormData, type ArticleFormProps } from '@blog/types';
import { SimpleAssetsField } from '@media/components/Field/SimpleAssetsField';
import { SEOFields } from '@seo/components/SeoFields';
import { FormSimpleEditor } from '@shared/components/tiptap';
import { Button } from '@shared/components/ui/button';
import { Calendar } from '@shared/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { useSlug } from '@shared/hooks/use-slug';
import AppLayout from '@shared/layouts/app-layout';
import { cn } from '@shared/lib/utils';
import { type BreadcrumbItem } from '@shared/types';
import { format } from 'date-fns';
import { CalendarIcon, Save } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function ArticleForm({ article, categories }: ArticleFormProps) {
    const isEditing = !!article;
    const pageTitle = isEditing ? 'Edit Article' : 'Create Article';
    const submitText = isEditing ? 'Update Article' : 'Create Article';
    const submittingText = isEditing ? 'Updating...' : 'Creating...';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Blog Management', href: route('admin.blog.index') },
        {
            title: pageTitle,
            href: isEditing ? route('admin.blog.edit', { blog: article.id }) : route('admin.blog.create'),
        },
    ];

    const [activeTab, setActiveTab] = useState('main');
    const { generateSlug } = useSlug();

    const form = useForm<ArticleFormData>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            title: article?.title || '',
            slug: article?.slug || '',
            content: article?.content || '',
            excerpt: article?.excerpt || '',
            category_id: article?.category_id?.toString() || article?.category?.id?.toString() || '',
            tags: article?.tags?.map((tag) => tag.id) || [],
            status: article?.status || 'draft',
            featured_image: article?.featured_image ? [article.featured_image.toString()] : [],
            meta_title: article?.meta_title || '',
            meta_description: article?.meta_description || '',
            seo: article?.seo || {},
            published_at: article?.published_at ? new Date(article.published_at) : undefined,
        },
    });

    // Log validation errors for debugging
    if (Object.keys(form.formState.errors).length > 0) {
        console.error('Form validation errors:', form.formState.errors);
    }

    const onSubmit = (data: ArticleFormData) => {
        console.log('Form submitted with data:', data);
        const formattedData = {
            ...data,
            published_at: data.published_at ? format(data.published_at, 'yyyy-MM-dd HH:mm:ss') : null,
        };

        if (isEditing) {
            router.put(route('admin.blog.update', { blog: article.id }), formattedData, {
                preserveState: true,
                preserveScroll: true,
                onError: (errors) => {
                    console.error('Server validation errors:', errors);
                },
            });
        } else {
            router.post(route('admin.blog.store'), formattedData, {
                preserveState: true,
                preserveScroll: true,
                onError: (errors) => {
                    console.error('Server validation errors:', errors);
                },
            });
        }
    };

    const onError = (errors: any) => {
        console.error('Zod validation errors:', errors);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${pageTitle}: ${article?.title || 'New Article'}`} />
            <Form {...form}>
                <form id="article-form" onSubmit={form.handleSubmit(onSubmit, onError)} className="flex h-full flex-col space-y-6 p-8 pt-6">
                    <div className="mx-auto w-full max-w-7xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-3xl font-bold">{pageTitle}</h2>
                            <div className="flex items-center space-x-4">
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {form.formState.isSubmitting ? submittingText : submitText}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-6">
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
                                    <div className="min-w-0 lg:col-span-4">
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
                                                                        placeholder="Enter article title"
                                                                        onInput={(event) => form.setValue('slug', generateSlug(event.target.value)) }
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
                                                                    <Input
                                                                        {...field}
                                                                        placeholder="article-slug"
                                                                    />
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
                                                                        folder: 'blog',
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
                                            <SEOFields
                                                data={{
                                                    seo: form.watch('seo'),
                                                    meta_title: form.watch('meta_title'),
                                                    meta_description: form.watch('meta_description'),
                                                    slug: form.watch('slug')
                                                }}
                                                setData={(key, value) => {
                                                    if (key === 'seo') {
                                                        form.setValue('seo', value as Record<string, unknown>);
                                                    } else {
                                                        form.setValue(key as keyof ArticleFormData, value as string);
                                                    }
                                                }}
                                                errors={form.formState.errors as Record<string, string>}
                                                showSlug={false}
                                                fallbackTitle={form.watch('title')}
                                                fallbackDescription={form.watch('excerpt')}
                                                fallbackImage={article?.featured_image_url}
                                            />
                                        </TabsContent>
                                    </div>

                                    <div className="space-y-6 lg:col-span-2">
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
                                                            <Select onValueChange={field.onChange} value={field.value}>
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
                                                            <Select onValueChange={field.onChange} value={field.value}>
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
                                                                                'w-full justify-start text-left font-normal',
                                                                                !field.value && 'text-muted-foreground',
                                                                            )}
                                                                        >
                                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                                            {field.value ? (
                                                                                format(field.value, 'PPP p')
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
                                                                    />
                                                                    {field.value && (
                                                                        <div className="border-t p-3">
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
                        </div>
                    </div>
                </form>
            </Form>
        </AppLayout>
    );
}
