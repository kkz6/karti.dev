import { Head, usePage } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import AppLayout from '@shared/layouts/app-layout';
import { SharedData, type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper, type Action, type TableConfig } from '@table/components';
import { ArrowLeft, Camera, Image, PlusSquare, Upload } from 'lucide-react';

interface Photo {
    id: number;
    title?: string;
    image_path: string;
    alt_text?: string;
    sort_order: number;
    width?: number;
    height?: number;
    file_size?: number;
    created_at: string;
    _primary_key: number;
}

interface PhotoCollection {
    id: number;
    title: string;
    slug: string;
    description?: string;
}

export default function Index({ collection, photos }: { collection: PhotoCollection; photos: TableConfig<Photo> }) {
    const { props } = usePage<SharedData>();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Photography', href: route('admin.photography.index') },
        { title: collection.title, href: route('admin.photography.show', { photography: collection.slug }) },
        { title: 'Photos', href: route('admin.photography.photos.index', collection.id) },
    ];

    const handleCustomAction = async (action: Action, keys: (string | number)[], onFinish?: () => void) => {
        const photoId = typeof keys[0] === 'string' ? parseInt(keys[0]) : keys[0];
        const photo = photos.results?.data?.find((item) => item._primary_key === photoId);

        if (photo) {
            if (action.id === 'edit') {
                window.location.href = route('admin.photography.photos.edit', [collection.id, photo.id]);
            }
        }

        if (onFinish) onFinish();
    };

    const handleCreatePhoto = () => {
        window.location.href = route('admin.photography.photos.create', collection.id);
    };

    const handleBackToCollection = () => {
        window.location.href = route('admin.photography.show', { photography: collection.slug });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Photos - ${collection.title}`} />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Photos</h2>
                        <p className="text-muted-foreground">Manage photos in "{collection.title}" collection</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button onClick={handleCreatePhoto}>
                            <PlusSquare className="mr-2 h-4 w-4" />
                            Add Photo
                        </Button>
                        <Button variant="outline" onClick={handleBackToCollection}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Collection
                        </Button>
                    </div>
                </div>

                <InertiaTableWrapper
                    resource={photos}
                    emptyState={{
                        title: 'No photos found',
                        description: 'Get started by adding your first photo to this collection.',
                        icons: [Camera, Image, PlusSquare],
                        action: {
                            label: 'Add Photo',
                            onClick: handleCreatePhoto,
                        },
                    }}
                    onCustomAction={handleCustomAction}
                />
            </div>
        </AppLayout>
    );
}