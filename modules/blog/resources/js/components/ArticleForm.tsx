import { articleSchema, type ArticleFormData, type ArticleFormProps } from '@blog/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head } from '@inertiajs/react';
import { SimpleAssetsField } from '@media/components/Field/SimpleAssetsField';
import { SEOFields } from '@seo/components/SeoFields';
import { CategoryPicker } from '@shared/components/category-picker';
import { LocalTrafficCard } from '@shared/components/local-traffic-card';
import { ContentEditorHeader, EditorErrorSummary, EditorPublishedControl, EditorViewLink } from '@shared/components/content-editor';
import { EditorDateField } from '@shared/components/editor-date-field';
import { EditorRelationsField } from '@shared/components/editor-relations-field';
import { FormSimpleEditor } from '@shared/components/tiptap';
import { Card, CardContent } from '@shared/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { useEditorSave } from '@shared/hooks/use-editor-save';
import { useAdminTab } from '@shared/hooks/use-admin-tab';
import { useSlug } from '@shared/hooks/use-slug';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import type { BaseSyntheticEvent } from 'react';
import { useForm } from 'react-hook-form';

export default function ArticleForm({ article, categories, tags = [] }: ArticleFormProps) {
    const isEditing = !!article;
    const pageTitle = isEditing ? 'Edit Article' : 'Create Article';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Blog Management', href: route('admin.blog.index') },
        {
            title: pageTitle,
            href: isEditing ? route('admin.blog.edit', { blog: article.id }) : route('admin.blog.create'),
        },
    ];

    const [activeTab, setActiveTab] = useAdminTab(['main', 'content', 'seo'], 'main');
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

    const { saving, save } = useEditorSave(form, route('admin.blog.index'));

    const onSubmit = (data: ArticleFormData, event?: BaseSyntheticEvent) => {
        save(
            isEditing ? 'put' : 'post',
            isEditing ? route('admin.blog.update', { blog: article.id }) : route('admin.blog.store'),
            {
                ...data,
                published_at: data.published_at?.toISOString() ?? null,
            },
            event,
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${pageTitle}: ${article?.title || 'New Article'}`} />
            <Form {...form}>
                <form id="article-form" onSubmit={form.handleSubmit(onSubmit)} className="content-editor">
                    <div className="w-full">
                        <ContentEditorHeader
                            title={form.watch('title') || 'New article'}
                            status={form.watch('status')}
                            formId="article-form"
                            processing={saving}
                            backHref={route('admin.blog.index')}
                            onArchive={() =>
                                form.setValue('status', form.getValues('status') === 'archived' ? 'draft' : 'archived', { shouldDirty: true })
                            }
                        />
                        <EditorErrorSummary errors={form.formState.errors} />

                        <div className="space-y-6">
                            {/* Tabs Header */}
                            <Tabs defaultValue="main" value={activeTab} onValueChange={setActiveTab} className="content-editor-tabs w-full">
                                <TabsList className="border-border text-foreground h-auto gap-2 rounded-none border-b bg-transparent px-0 py-1">
                                    <TabsTrigger
                                        value="main"
                                        className="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary data-[state=active]:hover:bg-accent relative after:absolute after:inset-x-0 after:bottom-0 after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                    >
                                        Main
                                    </TabsTrigger>
                                    <TabsTrigger value="content">Content</TabsTrigger>
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
                                    <div className="content-editor-main">
                                        <TabsContent value="main" className="mt-0">
                                            <div className="content-editor-panel space-y-8">
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
                                                                    placeholder="Enter article title"
                                                                    onChange={(event) => {
                                                                        const title = event.target.value;
                                                                        const previous = form.getValues('title');
                                                                        const slug = form.getValues('slug');
                                                                        field.onChange(title);
                                                                        if (!isEditing && (!slug || slug === generateSlug(previous)))
                                                                            form.setValue('slug', generateSlug(title));
                                                                    }}
                                                                />
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
                                                <FormField
                                                    control={form.control}
                                                    name="excerpt"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Excerpt</FormLabel>
                                                            <FormControl>
                                                                <Textarea
                                                                    {...field}
                                                                    value={field.value ?? ''}
                                                                    placeholder="Brief description of the article"
                                                                    rows={3}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="content" className="mt-0">
                                            <div className="content-editor-panel">
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
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="seo" className="mt-0 space-y-6">
                                            <SEOFields
                                                data={{
                                                    seo: form.watch('seo'),
                                                    meta_title: form.watch('meta_title'),
                                                    meta_description: form.watch('meta_description'),
                                                    slug: form.watch('slug'),
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

                                    <div className="content-editor-aside space-y-6">
                                        <LocalTrafficCard />
                                        <EditorViewLink
                                            href={article?.id ? route('articles.show', article.slug) : undefined}
                                            published={article?.status === 'published'}
                                        />
                                        <EditorPublishedControl
                                            value={form.watch('status')}
                                            publishedValue="published"
                                            draftValue="draft"
                                            onChange={(value) => form.setValue('status', value, { shouldDirty: true })}
                                            disabled={saving}
                                            error={form.formState.errors.status?.message}
                                        />

                                        <Card>
                                            <CardContent className="space-y-6">
                                                <FormField
                                                    control={form.control}
                                                    name="slug"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Slug *</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value ?? ''} placeholder="article-slug" />
                                                            </FormControl>
                                                            <FormDescription>Used in URLs. Auto-generated from title.</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="category_id"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Category *</FormLabel>
                                                            <FormControl>
                                                                <CategoryPicker
                                                                    {...field}
                                                                    categories={categories}
                                                                    createUrl={route('admin.categories.store')}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="published_at"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-col">
                                                            <FormLabel htmlFor="article-publish-date">Publish Date</FormLabel>
                                                            <EditorDateField
                                                                triggerId="article-publish-date"
                                                                value={field.value}
                                                                onChange={(date) => field.onChange(date ?? null)}
                                                                disabled={saving}
                                                                invalid={!!form.formState.errors.published_at}
                                                            />
                                                            <FormDescription>Leave empty to publish immediately</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="tags"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel htmlFor="article-tags">Tags</FormLabel>
                                                            <EditorRelationsField
                                                                triggerId="article-tags"
                                                                label="Tags"
                                                                options={tags}
                                                                value={field.value ?? []}
                                                                onChange={field.onChange}
                                                                invalid={!!form.formState.errors.tags}
                                                            />
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
