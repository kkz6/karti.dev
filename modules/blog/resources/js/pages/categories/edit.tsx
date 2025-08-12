import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Category {
    id: number;
    name: string;
    slug: string;
    description?: string;
    meta_title?: string;
    meta_description?: string;
}

export default function Edit({ category }: { category: Category }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Articles', href: route('admin.blog.index') },
        { title: 'Categories', href: route('admin.blog.categories.index') },
        { title: category.name, href: route('admin.blog.categories.show', category.id) },
        { title: 'Edit', href: route('admin.blog.categories.edit', category.id) },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        meta_title: category.meta_title || '',
        meta_description: category.meta_description || '',
    });

    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('admin.blog.categories.update', category.id));
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
            // TODO: Implement delete functionality using router.delete
            console.log('Delete category:', category.id);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Category: ${category.name}`} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={route('admin.blog.categories.show', category.id)}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Category
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Category</h1>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-6 md:col-span-2">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                    <CardDescription>Update the basic details for the category</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Enter category name"
                                            className={errors.name ? 'border-red-500' : ''}
                                        />
                                        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="slug">Slug *</Label>
                                        <Input
                                            id="slug"
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            placeholder="category-slug"
                                            className={errors.slug ? 'border-red-500' : ''}
                                        />
                                        {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug}</p>}
                                        <p className="text-muted-foreground mt-1 text-sm">Used in URLs.</p>
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Describe this category..."
                                            rows={3}
                                            className={errors.description ? 'border-red-500' : ''}
                                        />
                                        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* SEO Settings */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>SEO Settings</CardTitle>
                                    <CardDescription>Optimize this category for search engines</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="meta_title">Meta Title</Label>
                                        <Input
                                            id="meta_title"
                                            value={data.meta_title}
                                            onChange={(e) => setData('meta_title', e.target.value)}
                                            placeholder="SEO title for this category"
                                            className={errors.meta_title ? 'border-red-500' : ''}
                                        />
                                        {errors.meta_title && <p className="mt-1 text-sm text-red-500">{errors.meta_title}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="meta_description">Meta Description</Label>
                                        <Textarea
                                            id="meta_description"
                                            value={data.meta_description}
                                            onChange={(e) => setData('meta_description', e.target.value)}
                                            placeholder="SEO description for this category..."
                                            rows={3}
                                            className={errors.meta_description ? 'border-red-500' : ''}
                                        />
                                        {errors.meta_description && <p className="mt-1 text-sm text-red-500">{errors.meta_description}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button type="submit" disabled={processing} className="w-full">
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Updating...' : 'Update Category'}
                                    </Button>
                                    <Button type="button" variant="outline" asChild className="w-full">
                                        <Link href={route('admin.blog.categories.show', category.id)}>Cancel</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Danger Zone */}
                            <Card className="border-red-200">
                                <CardHeader>
                                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                                    <CardDescription>Irreversible actions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button type="button" variant="destructive" size="sm" onClick={handleDelete} className="w-full">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Category
                                    </Button>
                                    <p className="text-muted-foreground mt-2 text-xs">
                                        This action cannot be undone. Articles in this category will be unassigned.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
