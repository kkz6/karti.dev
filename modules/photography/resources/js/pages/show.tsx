import { Head, router } from '@inertiajs/react';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { ArrowLeft, Edit, Image, Trash2 } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    slug: string;
}

interface Photo {
    id: number;
    title?: string;
    image_path: string;
    alt_text?: string;
    sort_order: number;
    width?: number;
    height?: number;
    file_size?: number;
}

interface PhotoCollection {
    id: number;
    title: string;
    slug: string;
    description?: string;
    cover_image?: string;
    status: 'draft' | 'published' | 'archived';
    featured: boolean;
    sort_order: number;
    meta_title?: string;
    meta_description?: string;
    published_at?: string;
    created_at: string;
    updated_at: string;
    categories?: Category[];
    photos?: Photo[];
}

export default function Show({ collection }: { collection: PhotoCollection }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Photography ', href: route('admin.photography.index') },
        { title: collection.title, href: route('admin.photography.show', { photography: collection.slug }) },
    ];

    const handleEdit = () => {
        window.location.href = route('admin.photography.edit', { photography: collection.slug });
    };

    const handleManagePhotos = () => {
        window.location.href = route('admin.photography.photos.index', collection.id);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this collection? This action cannot be undone.')) {
            router.delete(route('admin.photography.destroy', { photography: collection.slug }));
        }
    };

    const formatBytes = (bytes?: number) => {
        if (!bytes) return '—';
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800';
            case 'draft':
                return 'bg-yellow-100 text-yellow-800';
            case 'archived':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={collection.title} />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <div className="flex items-center space-x-2">
                            <h2 className="text-3xl font-bold tracking-tight">{collection.title}</h2>
                            <Badge className={getStatusColor(collection.status)}>{collection.status}</Badge>
                            {collection.featured && <Badge variant="secondary">Featured</Badge>}
                        </div>
                        <p className="text-muted-foreground">{collection.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={handleManagePhotos}>
                            <Image className="mr-2 h-4 w-4" />
                            Manage Photos ({collection.photos?.length || 0})
                        </Button>
                        <Button variant="outline" onClick={handleEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                        <Button variant="outline" asChild>
                            <a href={route('admin.photography.index')}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Collections
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Collection Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <h4 className="font-medium">Slug</h4>
                                        <p className="text-muted-foreground text-sm">{collection.slug}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium">Sort Order</h4>
                                        <p className="text-muted-foreground text-sm">{collection.sort_order}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium">Created</h4>
                                        <p className="text-muted-foreground text-sm">{new Date(collection.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-medium">Updated</h4>
                                        <p className="text-muted-foreground text-sm">{new Date(collection.updated_at).toLocaleDateString()}</p>
                                    </div>
                                    {collection.published_at && (
                                        <div>
                                            <h4 className="font-medium">Published</h4>
                                            <p className="text-muted-foreground text-sm">{new Date(collection.published_at).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>

                                {collection.categories && collection.categories.length > 0 && (
                                    <div>
                                        <h4 className="mb-2 font-medium">Categories</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {collection.categories.map((category) => (
                                                <Badge key={category.id} variant="outline">
                                                    {category.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {collection.meta_title || collection.meta_description ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>SEO Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {collection.meta_title && (
                                        <div>
                                            <h4 className="font-medium">Meta Title</h4>
                                            <p className="text-muted-foreground text-sm">{collection.meta_title}</p>
                                        </div>
                                    )}
                                    {collection.meta_description && (
                                        <div>
                                            <h4 className="font-medium">Meta Description</h4>
                                            <p className="text-muted-foreground text-sm">{collection.meta_description}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ) : null}
                    </div>

                    <div>
                        {collection.cover_image && (
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle>Cover Image</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <img src={collection.cover_image} alt={collection.title} className="h-48 w-full rounded-md object-cover" />
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Photos</CardTitle>
                                <CardDescription>{collection.photos?.length || 0} photos in this collection</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {collection.photos && collection.photos.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {collection.photos.slice(0, 6).map((photo) => (
                                            <div key={photo.id} className="aspect-square">
                                                <img
                                                    src={photo.image_path}
                                                    alt={photo.alt_text || photo.title || 'Photo'}
                                                    className="h-full w-full rounded-md object-cover"
                                                />
                                            </div>
                                        ))}
                                        {collection.photos.length > 6 && (
                                            <div className="bg-muted flex aspect-square items-center justify-center rounded-md">
                                                <span className="text-muted-foreground text-sm">+{collection.photos.length - 6} more</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm">No photos yet.</p>
                                )}
                                <Button className="mt-4 w-full" variant="outline" onClick={handleManagePhotos}>
                                    <Image className="mr-2 h-4 w-4" />
                                    Manage Photos
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
