import { Head, router, useForm } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { FormEventHandler } from 'react';

interface PhotoCollection {
    id: number;
    title: string;
    slug: string;
}

interface Photo {
    id: number;
    title?: string;
    description?: string;
    image_path: string;
    alt_text?: string;
    sort_order: number;
    width?: number;
    height?: number;
    file_size?: number;
    exif_data?: Record<string, any>;
}

export default function Edit({ collection, photo }: { collection: PhotoCollection; photo: Photo }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Photography Management', href: route('admin.photography.index') },
        { title: collection.title, href: route('admin.photography.show', collection.id) },
        { title: 'Photos', href: route('admin.photography.photos.index', collection.id) },
        { title: 'Edit Photo', href: route('admin.photography.photos.edit', [collection.id, photo.id]) },
    ];

    const { data, setData, put, processing, errors } = useForm({
        title: photo.title || '',
        description: photo.description || '',
        image_path: photo.image_path
            ? [
                  {
                      id: 'temp-' + Date.now(),
                      url: photo.image_path,
                      filename: 'photo-image',
                      extension: photo.image_path.split('.').pop() || 'jpg',
                      mime_type: 'image/jpeg',
                      aggregate_type: 'image',
                      size: photo.file_size || 0,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                      container_id: 'public',
                      disk: 'public',
                      directory: '/photography/photos',
                      is_image: true,
                      is_audio: false,
                      is_video: false,
                      path: photo.image_path,
                      formatted_size: '0 B',
                      dimensions:
                          photo.width && photo.height
                              ? {
                                    width: photo.width,
                                    height: photo.height,
                                }
                              : undefined,
                  } as MediaAsset,
              ]
            : ([] as MediaAsset[]),
        alt_text: photo.alt_text || '',
        sort_order: photo.sort_order || 0,
        width: photo.width || (null as number | null),
        height: photo.height || (null as number | null),
        file_size: photo.file_size || (null as number | null),
        exif_data: photo.exif_data || ({} as Record<string, any>),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('admin.photography.photos.update', [collection.id, photo.id]));
    };

    const handleImageChange = (assets: MediaAsset[]) => {
        setData('image_path', assets);

        // Auto-populate metadata from the selected asset
        if (assets.length > 0) {
            const asset = assets[0];
            if (asset.dimensions) {
                setData('width', asset.dimensions.width);
                setData('height', asset.dimensions.height);
            }
            setData('file_size', asset.size);
            if (!data.alt_text && asset.alt) {
                setData('alt_text', asset.alt);
            }
            if (!data.title && asset.title) {
                setData('title', asset.title);
            }
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
            router.delete(route('admin.photography.photos.destroy', [collection.id, photo.id]));
        }
    };

    const handleBackToPhotos = () => {
        window.location.href = route('admin.photography.photos.index', collection.id);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Photo" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Edit Photo</h2>
                        <p className="text-muted-foreground">Update photo in "{collection.title}" collection.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Photo
                        </Button>
                        <Button variant="outline" onClick={handleBackToPhotos}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Photos
                        </Button>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Photo Details</CardTitle>
                                <CardDescription>Basic information about the photo.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <SimpleAssetsField
                                        name="Photo Image"
                                        data={data.image_path}
                                        config={{
                                            container: 'public',
                                            folder: '/photography/photos',
                                            max_files: 1,
                                            mode: 'grid',
                                            canEdit: true,
                                            accept: 'image/*',
                                        }}
                                        required={true}
                                        onChange={handleImageChange}
                                        onError={(error) => console.error('Photo image error:', error)}
                                    />
                                    {errors.image_path && <div className="text-sm text-red-600">{errors.image_path}</div>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        error={errors.title}
                                        placeholder="Enter photo title"
                                    />
                                    {errors.title && <div className="text-sm text-red-600">{errors.title}</div>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="alt_text">Alt Text</Label>
                                    <Input
                                        id="alt_text"
                                        value={data.alt_text}
                                        onChange={(e) => setData('alt_text', e.target.value)}
                                        error={errors.alt_text}
                                        placeholder="Descriptive text for accessibility"
                                    />
                                    {errors.alt_text && <div className="text-sm text-red-600">{errors.alt_text}</div>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Optional description of the photo"
                                        rows={3}
                                    />
                                    {errors.description && <div className="text-sm text-red-600">{errors.description}</div>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Settings</CardTitle>
                                <CardDescription>Display and ordering settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
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

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="width">Width (px)</Label>
                                        <Input
                                            id="width"
                                            type="number"
                                            min="1"
                                            value={data.width || ''}
                                            onChange={(e) => setData('width', parseInt(e.target.value) || null)}
                                            placeholder="Auto-detected"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="height">Height (px)</Label>
                                        <Input
                                            id="height"
                                            type="number"
                                            min="1"
                                            value={data.height || ''}
                                            onChange={(e) => setData('height', parseInt(e.target.value) || null)}
                                            placeholder="Auto-detected"
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="file_size">File Size (bytes)</Label>
                                    <Input
                                        id="file_size"
                                        type="number"
                                        min="0"
                                        value={data.file_size || ''}
                                        onChange={(e) => setData('file_size', parseInt(e.target.value) || null)}
                                        placeholder="Auto-populated from selected image"
                                        disabled
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => window.history.back()}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            Update Photo
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
