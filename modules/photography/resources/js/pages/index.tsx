import { Head, usePage } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { SharedData, type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper, type Action, type TableConfig } from '@table/components';
import { Camera, Eye, Image, PlusSquare } from 'lucide-react';

// Local interfaces for photography admin
interface Photo {
    id: number;
    title: string;
    slug: string;
    description?: string;
    image_ids: number[];
    cover_image?: string;
    status: 'draft' | 'published' | 'archived';
    featured: boolean;
    sort_order: number;
    published_at?: string;
    created_at: string;
    updated_at: string;
    image_count: number;
    categories?: Array<{
        id: number;
        name: string;
        slug: string;
    }>;
    _primary_key: number;
}

interface Category {
    id: number;
    name: string;
    slug: string;
}

export default function Index({ photos, categories }: { photos: TableConfig<Photo>; categories: Category[] }) {
    const { props } = usePage<SharedData>();
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Photography', href: route('admin.photography.index') }];

    const handleCustomAction = async (action: Action, keys: (string | number)[], onFinish?: () => void) => {
        const photoId = typeof keys[0] === 'string' ? parseInt(keys[0]) : keys[0];
        const photo = photos.results?.data?.find((item) => item._primary_key === photoId);

        if (photo) {
            if (action.id === 'edit') {
                window.location.href = route('admin.photography.edit', { photography: photo.id });
            }
            if (action.id === 'show') {
                window.location.href = route('admin.photography.show', { photography: photo.id });
            }
        }

        if (onFinish) onFinish();
    };

    const handleCreateGallery = () => {
        window.location.href = route('admin.photography.create');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Photography" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Photography </h2>
                    <div className="flex items-center space-x-2">
                        <Button onClick={handleCreateGallery}>
                            <PlusSquare className="mr-2 h-4 w-4" />
                            Create Gallery
                        </Button>
                    </div>
                </div>

                <InertiaTableWrapper
                    resource={photos}
                    emptyState={{
                        title: 'No photo galleries found',
                        description: 'Get started by creating your first photo gallery.',
                        icons: [Camera, Image, PlusSquare],
                        action: {
                            label: 'Create Gallery',
                            onClick: handleCreateGallery,
                        },
                    }}
                    onCustomAction={handleCustomAction}
                />
            </div>
        </AppLayout>
    );
}
