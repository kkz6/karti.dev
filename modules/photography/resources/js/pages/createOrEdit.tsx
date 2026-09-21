import { Head, useForm } from '@inertiajs/react';
import { SimpleAssetsField } from '@media/components/Field/SimpleAssetsField';
import { SEOFields } from '@seo/components/SeoFields';
import { seoSchema } from '@seo/types/seo-schema';
import { CategoryPicker } from '@shared/components/category-picker';
import { ContentEditorHeader, EditorErrorSummary, EditorPublishedControl, EditorViewLink } from '@shared/components/content-editor';
import { EditorDateField } from '@shared/components/editor-date-field';
import { LocalTrafficCard } from '@shared/components/local-traffic-card';
import { PageContainer } from '@shared/components/page-container';
import { FormSimpleEditor } from '@shared/components/tiptap/form-simple-editor';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Switch } from '@shared/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { UnsavedChangesGuard } from '@shared/components/unsaved-changes-guard';
import { useAdminTab } from '@shared/hooks/use-admin-tab';
import { editorSaveOptions } from '@shared/hooks/use-editor-save';
import { useSlug } from '@shared/hooks/use-slug';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { FormEventHandler } from 'react';
import { type PhotoGalleryCreateEditPageProps, type PhotoGalleryFormData } from '../types';

export default function Create({ categories, photo }: PhotoGalleryCreateEditPageProps) {
    const isEdit = !!photo;

    const breadcrumbs: BreadcrumbItem[] = isEdit
        ? [
              { title: 'Photography', href: route('admin.photography.index') },
              { title: photo.title, href: route('admin.photography.edit', { photography: photo.id }) },
              { title: 'Edit', href: route('admin.photography.edit', { photography: photo.id }) },
          ]
        : [
              { title: 'Photography', href: route('admin.photography.index') },
              { title: 'Create Gallery', href: route('admin.photography.create') },
          ];

    const [activeTab, setActiveTab] = useAdminTab(['main', 'content', 'seo'], 'main');
    const { handleTitleChange: handleSlugTitleChange } = useSlug({ autoGenerate: !isEdit });

    const { data, setData, setDefaults, post, put, processing, errors, isDirty } = useForm<PhotoGalleryFormData>({
        title: photo?.title || '',
        slug: photo?.slug || '',
        description: photo?.description || '',
        image_ids: photo ? (photo.image_ids || []).map((id) => id.toString()) : [],
        cover_image: photo?.cover_image?.toString() || '',
        categories: photo?.categories?.map((cat) => cat.id) || [],
        status: photo?.status || 'draft',
        featured: photo?.featured || false,
        sort_order: photo?.sort_order || 0,
        meta_title: photo?.meta_title || '',
        meta_description: photo?.meta_description || '',
        seo: seoSchema.parse(photo?.seo) ?? {},
        published_at: photo?.published_at || '',
        photo_id: photo?.id || null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(
                route('admin.photography.update', { photography: photo!.slug }),
                editorSaveOptions(e, route('admin.photography.index'), () => setDefaults()),
            );
        } else {
            post(
                route('admin.photography.store'),
                editorSaveOptions(e, route('admin.photography.index'), () => setDefaults()),
            );
        }
    };

    const handleTitleChange = (value: string) => {
        handleSlugTitleChange(
            value,
            data.slug,
            isEdit ? photo!.title : data.title,
            (title) => setData('title', title),
            (slug) => setData('slug', slug),
        );
    };

    const publishedDate = data.published_at ? new Date(data.published_at) : undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? `Edit ${photo!.title}` : 'Create Photo Gallery'} />
            <UnsavedChangesGuard dirty={isDirty} />
            <PageContainer className="content-editor">
                <div className="w-full">
                    <ContentEditorHeader
                        title={data.title || 'New gallery'}
                        status={data.status}
                        formId="gallery-form"
                        processing={processing}
                        backHref={route('admin.photography.index')}
                        onArchive={() => setData('status', data.status === 'archived' ? 'draft' : 'archived')}
                    />
                    <EditorErrorSummary errors={errors} />

                    <form id="gallery-form" onSubmit={submit}>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="content-editor-tabs w-full">
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

                            <div className="content-editor-grid">
                                <div className="content-editor-main">
                                    <TabsContent value="main" className="mt-0">
                                        <div className="content-editor-panel space-y-8">
                                            <div className="grid gap-2">
                                                <Label htmlFor="title">Title *</Label>
                                                <Input
                                                    id="title"
                                                    value={data.title}
                                                    onChange={(e) => handleTitleChange(e.target.value)}
                                                    placeholder="Enter gallery title"
                                                    required
                                                    className={errors.title ? 'border-red-500' : ''}
                                                />
                                                {errors.title && <div className="text-sm text-red-600">{errors.title}</div>}
                                            </div>
                                            <div className="grid gap-2">
                                                <SimpleAssetsField
                                                    name="Cover Image"
                                                    data={data.cover_image ? [data.cover_image] : []}
                                                    config={{
                                                        folder: '/photography/covers',
                                                        max_files: 1,
                                                        mode: 'grid',
                                                        canEdit: true,
                                                        accept: 'image/*',
                                                    }}
                                                    onChange={(assets) => setData('cover_image', assets[0]?.toString() || '')}
                                                    onError={(error) => console.error('Cover image error:', error)}
                                                />
                                                {errors.cover_image && <div className="text-sm text-red-600">{errors.cover_image}</div>}
                                            </div>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="content" className="mt-0">
                                        <div className="content-editor-panel space-y-8">
                                            <div className="grid gap-2">
                                                <Label htmlFor="description">Description</Label>
                                                <FormSimpleEditor
                                                    content={data.description}
                                                    onChange={(content) => setData('description', content)}
                                                    placeholder="Brief description of the gallery"
                                                />
                                                {errors.description && <div className="text-sm text-red-600">{errors.description}</div>}
                                            </div>
                                            <div className="space-y-2">
                                                <SimpleAssetsField
                                                    name="Gallery Images"
                                                    data={data.image_ids}
                                                    config={{
                                                        folder: '/photography/galleries',
                                                        max_files: 50,
                                                        mode: 'grid',
                                                        canEdit: true,
                                                        accept: 'image/*',
                                                    }}
                                                    onChange={(assetIds) =>
                                                        setData(
                                                            'image_ids',
                                                            assetIds.map((id) => id.toString()),
                                                        )
                                                    }
                                                    onError={(error) => console.error('Gallery images error:', error)}
                                                    required
                                                />
                                                {errors.image_ids && <div className="text-sm text-red-600">{errors.image_ids}</div>}
                                                <p className="text-muted-foreground mt-2 text-sm">
                                                    {data.image_ids.length} image{data.image_ids.length !== 1 ? 's' : ''} selected
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="seo" className="mt-0 space-y-6">
                                        <SEOFields
                                            fallbackTitle={data.title}
                                            fallbackDescription={data.description
                                                .replace(/<[^>]*>/g, ' ')
                                                .replace(/\s+/g, ' ')
                                                .trim()}
                                            previewPath={`/photography/${data.slug || 'gallery'}`}
                                            data={{
                                                seo: data.seo,
                                                meta_title: data.meta_title,
                                                meta_description: data.meta_description,
                                                slug: data.slug,
                                            }}
                                            setData={(key, value) => {
                                                setData(key as keyof typeof data, value);
                                            }}
                                            errors={errors}
                                            showSlug={false}
                                        />
                                    </TabsContent>
                                </div>

                                {/* Sidebar - 2/6 */}
                                <div className="content-editor-aside space-y-6">
                                    <LocalTrafficCard />
                                    <EditorViewLink
                                        href={photo?.id ? route('photography.show', photo.slug) : undefined}
                                        published={photo?.status === 'published'}
                                    />
                                    <EditorPublishedControl
                                        value={data.status}
                                        publishedValue="published"
                                        draftValue="draft"
                                        onChange={(value) => setData('status', value)}
                                        disabled={processing}
                                        error={errors.status}
                                    />
                                    <Card>
                                        <CardContent className="space-y-6">
                                            <div className="grid gap-2">
                                                <Label htmlFor="slug">Slug *</Label>
                                                <Input
                                                    id="slug"
                                                    value={data.slug}
                                                    onChange={(e) => setData('slug', e.target.value)}
                                                    placeholder="gallery-slug"
                                                    required
                                                    className={errors.slug ? 'border-red-500' : ''}
                                                />
                                                <p className="text-muted-foreground text-sm">Used in URLs. Auto-generated from title.</p>
                                                {errors.slug && <div className="text-sm text-red-600">{errors.slug}</div>}
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="gallery-publish-date">Publish Date</Label>
                                                <EditorDateField
                                                    triggerId="gallery-publish-date"
                                                    value={publishedDate}
                                                    onChange={(date) => setData('published_at', date?.toISOString() ?? '')}
                                                    disabled={processing}
                                                    invalid={!!errors.published_at}
                                                />
                                                <p className="text-muted-foreground text-sm">Leave empty to publish immediately.</p>
                                                {errors.published_at && <div className="text-sm text-red-600">{errors.published_at}</div>}
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="categories">Category</Label>
                                                <CategoryPicker
                                                    id="categories"
                                                    categories={categories}
                                                    value={data.categories[0]?.toString() || ''}
                                                    onChange={(value) => setData('categories', value ? [parseInt(value)] : [])}
                                                    createUrl={route('admin.categories.store')}
                                                    allowNone
                                                    disabled={processing}
                                                    aria-invalid={!!errors.categories}
                                                />
                                                {errors.categories && <div className="text-sm text-red-600">{errors.categories}</div>}
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="featured"
                                                    checked={data.featured}
                                                    onCheckedChange={(checked) => setData('featured', checked)}
                                                />
                                                <Label htmlFor="featured">Featured Gallery</Label>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="sort_order">Sort Order</Label>
                                                <Input
                                                    id="sort_order"
                                                    type="number"
                                                    min="0"
                                                    value={data.sort_order}
                                                    onChange={(e) => setData('sort_order', parseInt(e.target.value) || 0)}
                                                />
                                                {errors.sort_order && <div className="text-sm text-red-600">{errors.sort_order}</div>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </Tabs>
                    </form>
                </div>
            </PageContainer>
        </AppLayout>
    );
}
