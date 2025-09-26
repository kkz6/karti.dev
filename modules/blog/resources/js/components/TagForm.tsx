import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { useSlug } from '@shared/hooks/use-slug';
import { Save, Trash2 } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Tag {
    id: number;
    name: string;
    slug: string;
    description?: string;
    meta_title?: string;
    meta_description?: string;
}

interface TagFormProps {
    tag?: Tag;
    mode: 'create' | 'edit';
}

export default function TagForm({ tag, mode }: TagFormProps) {
    const isEditing = mode === 'edit' && tag;

    const breadcrumbs: BreadcrumbItem[] = isEditing
        ? [
              { title: 'Blog Management', href: route('admin.blog.index') },
              { title: 'Tags', href: route('admin.tags.index') },
              { title: tag.name, href: route('admin.tags.index') },
              { title: 'Edit', href: route('admin.tags.edit', { tag: tag.id }) },
          ]
        : [
              { title: 'Blog Management', href: route('admin.blog.index') },
              { title: 'Tags', href: route('admin.tags.index') },
              { title: 'Create Tag', href: route('admin.tags.create') },
          ];

    const [activeTab, setActiveTab] = useState('main');
    const { handleTitleChange } = useSlug();

    const { data, setData, post, put, processing, errors } = useForm({
        name: tag?.name || '',
        slug: tag?.slug || '',
        description: tag?.description || '',
        meta_title: tag?.meta_title || '',
        meta_description: tag?.meta_description || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('admin.tags.update', { tag: tag.slug || tag.id }));
        } else {
            post(route('admin.tags.store'));
        }
    };

    const handleNameChange = (name: string) => {
        handleTitleChange(
            name,
            data.slug,
            isEditing ? tag.name : data.name,
            (title) => setData('name', title),
            (slug) => setData('slug', slug)
        );
    };

    const handleDelete = () => {
        if (isEditing && confirm(`Are you sure you want to delete "${tag.name}"?`)) {
            router.delete(route('admin.tags.destroy', { tag: tag.slug || tag.id }));
        }
    };

    const pageTitle = isEditing ? `Edit Tag: ${tag.name}` : 'Create Tag';
    const headerTitle = isEditing ? 'Edit Tag' : 'Create Tag';
    const submitButtonText = processing
        ? (isEditing ? 'Updating...' : 'Creating...')
        : (isEditing ? 'Update Tag' : 'Create Tag');
    const cardDescription = isEditing
        ? 'Update the basic details for the tag'
        : 'Enter the basic details for the new tag';
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                <div className="mx-auto w-full max-w-7xl">
                    {/* Header with Actions */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{headerTitle}</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button type="submit" form="tag-form" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                {submitButtonText}
                            </Button>
                            {isEditing && (
                                <Button type="button" variant="destructive" onClick={handleDelete}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>

                    <form id="tag-form" onSubmit={submit} className="space-y-6">
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
                                                <CardDescription>{cardDescription}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div>
                                                    <Label htmlFor="name">Name *</Label>
                                                    <Input
                                                        id="name"
                                                        value={data.name}
                                                        onChange={(e) => handleNameChange(e.target.value)}
                                                        placeholder="Enter tag name"
                                                        className={errors.name ? 'border-red-500' : ''}
                                                    />
                                                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                                                </div>

                                                <div>
                                                    <Label htmlFor="description">Description</Label>
                                                    <Textarea
                                                        id="description"
                                                        value={data.description}
                                                        onChange={(e) => setData('description', e.target.value)}
                                                        placeholder="Describe this tag..."
                                                        rows={3}
                                                        className={errors.description ? 'border-red-500' : ''}
                                                    />
                                                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
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
                                                <div>
                                                    <Label htmlFor="meta_title">Meta Title</Label>
                                                    <Input
                                                        id="meta_title"
                                                        value={data.meta_title || ''}
                                                        onChange={(e) => setData('meta_title', e.target.value)}
                                                        placeholder="SEO title for search engines"
                                                        className={errors.meta_title ? 'border-red-500' : ''}
                                                        maxLength={60}
                                                    />
                                                    {errors.meta_title && <p className="mt-1 text-sm text-red-500">{errors.meta_title}</p>}
                                                    <p className="text-muted-foreground mt-1 text-sm">
                                                        {(data.meta_title || '').length}/60 characters
                                                    </p>
                                                </div>

                                                <div>
                                                    <Label htmlFor="meta_description">Meta Description</Label>
                                                    <Textarea
                                                        id="meta_description"
                                                        value={data.meta_description || ''}
                                                        onChange={(e) => setData('meta_description', e.target.value)}
                                                        placeholder="Brief description for search engine results"
                                                        rows={3}
                                                        className={errors.meta_description ? 'border-red-500' : ''}
                                                        maxLength={160}
                                                    />
                                                    {errors.meta_description && (
                                                        <p className="mt-1 text-sm text-red-500">{errors.meta_description}</p>
                                                    )}
                                                    <p className="text-muted-foreground mt-1 text-sm">
                                                        {(data.meta_description || '').length}/160 characters
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </div>

                                {/* Right column - fixed - 2/6 */}
                                <div className="lg:col-span-2">
                                    {/* URL Settings */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>URL Settings</CardTitle>
                                            <CardDescription>Configure the URL for this tag</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div>
                                                <Label htmlFor="slug">Tag Slug *</Label>
                                                <Input
                                                    id="slug"
                                                    value={data.slug}
                                                    onChange={(e) => setData('slug', e.target.value)}
                                                    placeholder="url-friendly-slug"
                                                    className={errors.slug ? 'border-red-500' : ''}
                                                />
                                                {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
                                                <p className="text-muted-foreground mt-1 text-sm">
                                                    {isEditing ? 'Used in URLs.' : 'Used in URLs. Auto-generated from name.'}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </Tabs>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
