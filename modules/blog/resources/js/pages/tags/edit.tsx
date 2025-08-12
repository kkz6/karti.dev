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

const defaultColors = ['#64748b', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

interface Tag {
    id: number;
    name: string;
    slug: string;
    description?: string;
    color?: string;
}

export default function Edit({ tag }: { tag: Tag }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Articles', href: route('admin.blog.index') },
        { title: 'Tags', href: route('admin.blog.tags.index') },
        { title: tag.name, href: route('admin.blog.tags.show', tag.id) },
        { title: 'Edit', href: route('admin.blog.tags.edit', tag.id) },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: tag.name || '',
        slug: tag.slug || '',
        description: tag.description || '',
        color: tag.color || '#64748b',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('admin.blog.tags.update', tag.id));
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${tag.name}"?`)) {
            // TODO: Implement delete functionality using router.delete
            console.log('Delete tag:', tag.id);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Tag: ${tag.name}`} />
            <div className="flex h-full flex-col space-y-6 p-8 pt-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={route('admin.blog.tags.show', tag.id)}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Tag
                            </Link>
                        </Button>
                        <div className="flex items-center space-x-2">
                            <div className="h-6 w-6 rounded-full border" style={{ backgroundColor: tag.color || '#64748b' }} />
                            <h1 className="text-3xl font-bold tracking-tight">Edit Tag</h1>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-6 md:col-span-2">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                    <CardDescription>Update the basic details for the tag</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Enter tag name"
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
                                            placeholder="tag-slug"
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
                                            placeholder="Describe this tag..."
                                            rows={3}
                                            className={errors.description ? 'border-red-500' : ''}
                                        />
                                        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="color">Color</Label>
                                        <div className="space-y-3">
                                            <Input
                                                id="color"
                                                type="color"
                                                value={data.color}
                                                onChange={(e) => setData('color', e.target.value)}
                                                className={`h-12 w-20 ${errors.color ? 'border-red-500' : ''}`}
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {defaultColors.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setData('color', color)}
                                                        className={`h-8 w-8 rounded border-2 transition-all ${
                                                            data.color === color ? 'scale-110 border-gray-800' : 'border-gray-300'
                                                        }`}
                                                        style={{ backgroundColor: color }}
                                                        title={color}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        {errors.color && <p className="mt-1 text-sm text-red-500">{errors.color}</p>}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Preview */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Preview</CardTitle>
                                    <CardDescription>How this tag will appear</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-muted/50 flex items-center space-x-2 rounded-lg border p-3">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
                                        <span className="font-medium">{data.name || 'Tag Name'}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button type="submit" disabled={processing} className="w-full">
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Updating...' : 'Update Tag'}
                                    </Button>
                                    <Button type="button" variant="outline" asChild className="w-full">
                                        <Link href={route('admin.blog.tags.show', tag.id)}>Cancel</Link>
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
                                        Delete Tag
                                    </Button>
                                    <p className="text-muted-foreground mt-2 text-xs">
                                        This action cannot be undone. The tag will be removed from all articles.
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
