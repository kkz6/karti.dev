import { Head, router, useForm } from '@inertiajs/react';
import { SEOFields } from '@seo/components/SeoFields';
import { seoSchema, type SeoData } from '@seo/types/seo-schema';
import { ContentEditorHeader, EditorErrorSummary } from '@shared/components/content-editor';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { editorSaveOptions } from '@shared/hooks/use-editor-save';
import { useSlug } from '@shared/hooks/use-slug';
import AppLayout from '@shared/layouts/app-layout';
import type { FormEvent } from 'react';

export interface TaxonomyEntry {
    id: number;
    name: string;
    slug: string;
    description?: string | null;
    seo?: SeoData;
}

export default function TaxonomyForm({ kind, entry }: { kind: 'category' | 'tag'; entry?: TaxonomyEntry }) {
    const label = kind === 'category' ? 'Category' : 'Tag';
    const resource = kind === 'category' ? 'categories' : 'tags';
    const backHref = route(`admin.${resource}.index`);
    const recordKey = entry ? (kind === 'category' ? entry.slug : entry.id) : undefined;
    const { handleTitleChange } = useSlug({ autoGenerate: !entry });
    const { data, setData, post, put, processing, errors } = useForm({
        name: entry?.name ?? '',
        slug: entry?.slug ?? '',
        description: entry?.description ?? '',
        seo: seoSchema.parse(entry?.seo) ?? {},
        meta_title: '',
        meta_description: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const options = editorSaveOptions(event, backHref);
        if (entry) put(route(`admin.${resource}.update`, recordKey), options);
        else post(route(`admin.${resource}.store`), options);
    };

    const remove = () => {
        if (entry && confirm(`Delete "${entry.name}"?`)) router.delete(route(`admin.${resource}.destroy`, recordKey));
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Articles', href: route('admin.blog.index') },
                { title: kind === 'category' ? 'Categories' : 'Tags', href: backHref },
                {
                    title: entry?.name ?? `Create ${label}`,
                    href: entry ? route(`admin.${resource}.edit`, recordKey) : route(`admin.${resource}.create`),
                },
            ]}
        >
            <Head title={entry ? `Edit ${label}: ${entry.name}` : `Create ${label}`} />
            <form id="taxonomy-form" onSubmit={submit} className="content-editor">
                <ContentEditorHeader
                    title={data.name || `New ${label.toLowerCase()}`}
                    formId="taxonomy-form"
                    processing={processing}
                    backHref={backHref}
                    onDelete={entry ? remove : undefined}
                />
                <EditorErrorSummary errors={errors} />
                <Tabs defaultValue="main" className="content-editor-tabs">
                    <TabsList>
                        <TabsTrigger value="main">Main</TabsTrigger>
                        <TabsTrigger value="seo">SEO</TabsTrigger>
                    </TabsList>
                    <div className="content-editor-grid">
                        <div className="content-editor-main">
                            <TabsContent value="main" className="mt-0">
                                <div className="content-editor-panel space-y-8">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            required
                                            maxLength={255}
                                            value={data.name}
                                            aria-invalid={!!errors.name}
                                            aria-describedby={errors.name ? 'name-error' : undefined}
                                            onChange={(e) =>
                                                handleTitleChange(
                                                    e.target.value,
                                                    data.slug,
                                                    data.name,
                                                    (name) => setData('name', name),
                                                    (slug) => setData('slug', slug),
                                                )
                                            }
                                        />
                                        {errors.name && (
                                            <p id="name-error" className="text-destructive text-sm">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            rows={5}
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            aria-invalid={!!errors.description}
                                            aria-describedby={errors.description ? 'description-error' : undefined}
                                        />
                                        {errors.description && (
                                            <p id="description-error" className="text-destructive text-sm">
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="seo" className="mt-0">
                                <SEOFields
                                    previewPath="/articles"
                                    data={data}
                                    setData={(key, value) => {
                                        if (key === 'seo' && typeof value !== 'string') setData('seo', value);
                                    }}
                                    errors={errors}
                                    showSlug={false}
                                    fallbackTitle={data.name}
                                    fallbackDescription={data.description}
                                />
                            </TabsContent>
                        </div>
                        <aside className="content-editor-aside">
                            <Card>
                                <CardContent>
                                    <div className="space-y-2">
                                        <Label htmlFor="slug">Slug *</Label>
                                        <Input
                                            id="slug"
                                            required
                                            maxLength={255}
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            aria-invalid={!!errors.slug}
                                            aria-describedby={errors.slug ? 'slug-error' : 'slug-hint'}
                                        />
                                        {errors.slug && (
                                            <p id="slug-error" className="text-destructive text-sm">
                                                {errors.slug}
                                            </p>
                                        )}
                                        <p id="slug-hint" className="text-muted-foreground text-sm">
                                            {entry ? 'Changing the slug changes the URL.' : 'Generated from the name. You can edit it.'}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </aside>
                    </div>
                </Tabs>
            </form>
        </AppLayout>
    );
}
