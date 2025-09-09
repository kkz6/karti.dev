import { Head, useForm } from '@inertiajs/react';
import { SimpleAssetsField } from '@media/components/Field';
import { MediaAsset } from '@media/types/media';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Switch } from '@shared/components/ui/switch';
import { Textarea } from '@shared/components/ui/textarea';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { ArrowLeft, Save } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function Create({ categories }: { categories: Category[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Photography', href: route('admin.photography.index') },
        { title: 'Create Gallery', href: route('admin.photography.create') },
    ];

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        slug: '',
        description: '',
        image_ids: [] as number[],
        cover_image: [] as MediaAsset[],
        categories: [] as number[],
        status: 'draft',
        featured: false,
        sort_order: 0,
        meta_title: '',
        meta_description: '',
        published_at: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.photography.store'));
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    };

    const handleTitleChange = (value: string) => {
        setData('title', value);
        if (!data.slug) {
            setData('slug', generateSlug(value));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Photo Gallery" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Create Photo Gallery</h2>
                        <p className="text-muted-foreground">Add a new photo gallery.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" asChild>
                            <a href={route('admin.photography.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Galleries
                            </a>
                        </Button>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Gallery Details</CardTitle>
                                <CardDescription>Basic information about the photo gallery.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Title *</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => handleTitleChange(e.target.value)}
                                        error={errors.title}
                                        placeholder="Enter gallery title"
                                        required
                                    />
                                    {errors.title && <div className="text-sm text-red-600">{errors.title}</div>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="slug">Slug *</Label>
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        error={errors.slug}
                                        placeholder="gallery-slug"
                                        required
                                    />
                                    {errors.slug && <div className="text-sm text-red-600">{errors.slug}</div>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Brief description of the gallery"
                                        rows={4}
                                    />
                                    {errors.description && <div className="text-sm text-red-600">{errors.description}</div>}
                                </div>

                                <div className="grid gap-2">
                                    <SimpleAssetsField
                                        name="Cover Image"
                                        data={data.cover_image}
                                        config={{
                                            container: 'public',
                                            folder: '/photography/covers',
                                            max_files: 1,
                                            mode: 'grid',
                                            canEdit: true,
                                            accept: 'image/*',
                                        }}
                                        onChange={(assets) => setData('cover_image', assets)}
                                        onError={(error) => console.error('Cover image error:', error)}
                                    />
                                    {errors.cover_image && <div className="text-sm text-red-600">{errors.cover_image}</div>}
                                </div>

                                <div className="grid gap-2">
                                    <SimpleAssetsField
                                        name="Gallery Images *"
                                        data={data.image_ids.map(id => ({ id } as any))}
                                        config={{
                                            container: 'public',
                                            folder: '/photography/galleries',
                                            max_files: 50,
                                            mode: 'grid',
                                            canEdit: true,
                                            accept: 'image/*',
                                        }}
                                        onChange={(assets) => setData('image_ids', assets.map((asset: any) => asset.id))}
                                        onError={(error) => console.error('Gallery images error:', error)}
                                        required
                                    />
                                    {errors.image_ids && <div className="text-sm text-red-600">{errors.image_ids}</div>}
                                    <p className="text-sm text-muted-foreground">
                                        {data.image_ids.length} image{data.image_ids.length !== 1 ? 's' : ''} selected
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Publication Settings</CardTitle>
                                <CardDescription>Control when and how the gallery is published.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="archived">Archived</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <div className="text-sm text-red-600">{errors.status}</div>}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch id="featured" checked={data.featured} onCheckedChange={(checked) => setData('featured', checked)} />
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

                                <div className="grid gap-2">
                                    <Label htmlFor="published_at">Publish Date</Label>
                                    <Input
                                        id="published_at"
                                        type="datetime-local"
                                        value={data.published_at}
                                        onChange={(e) => setData('published_at', e.target.value)}
                                    />
                                    {errors.published_at && <div className="text-sm text-red-600">{errors.published_at}</div>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="categories">Categories</Label>
                                    <Select 
                                        value={data.categories[0]?.toString() || ''} 
                                        onValueChange={(value) => setData('categories', value ? [parseInt(value)] : [])}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">None</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.categories && <div className="text-sm text-red-600">{errors.categories}</div>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>SEO Settings</CardTitle>
                            <CardDescription>Search engine optimization settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="meta_title">Meta Title</Label>
                                <Input
                                    id="meta_title"
                                    value={data.meta_title}
                                    onChange={(e) => setData('meta_title', e.target.value)}
                                    placeholder="SEO title for search engines"
                                />
                                {errors.meta_title && <div className="text-sm text-red-600">{errors.meta_title}</div>}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="meta_description">Meta Description</Label>
                                <Textarea
                                    id="meta_description"
                                    value={data.meta_description}
                                    onChange={(e) => setData('meta_description', e.target.value)}
                                    placeholder="SEO description for search engines"
                                    rows={3}
                                />
                                {errors.meta_description && <div className="text-sm text-red-600">{errors.meta_description}</div>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Create Gallery
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}