import { Head, usePage } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { SharedData, type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper, type Action, type TableConfig } from '@table/components';
import { Camera, Eye, Image, PlusSquare } from 'lucide-react';

// Local interfaces for photography admin
interface PhotoCollection {
    id: number;
    title: string;
    slug: string;
    description?: string;
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

export default function Index({ collections, categories }: { collections: TableConfig<PhotoCollection>; categories: Category[] }) {
    const { props } = usePage<SharedData>();
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Photography Management', href: route('admin.photography.index') }];

    const handleCustomAction = async (action: Action, keys: (string | number)[], onFinish?: () => void) => {
        const collectionId = typeof keys[0] === 'string' ? parseInt(keys[0]) : keys[0];
        const collection = collections.results?.data?.find((item) => item._primary_key === collectionId);

        if (collection) {
            if (action.id === 'edit') {
                window.location.href = route('admin.photography.edit', collection.id);
            }
            if (action.id === 'show') {
                window.location.href = route('admin.photography.show', collection.id);
            }
            if (action.id === 'manage-photos') {
                window.location.href = route('admin.photography.photos.index', collection.id);
            }
        }

        if (onFinish) onFinish();
    };

    const handleCreateCollection = () => {
        window.location.href = route('admin.photography.create');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Photography Management" />
            <div className="flex h-full flex-col space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Photography Management</h2>
                    <div className="flex items-center space-x-2">
                        <Button onClick={handleCreateCollection}>
                            <PlusSquare className="mr-2 h-4 w-4" />
                            Create Collection
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                        <div className="flex items-center space-x-2">
                            <Camera className="h-5 w-5 text-blue-500" />
                            <span className="font-medium">Total Collections</span>
                        </div>
                        <p className="text-2xl font-bold">{collections.results?.total || 0}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="flex items-center space-x-2">
                            <Image className="h-5 w-5 text-green-500" />
                            <span className="font-medium">Total Photos</span>
                        </div>
                        <p className="text-2xl font-bold">
                            {collections.results?.data?.reduce((sum, collection) => sum + collection.image_count, 0) || 0}
                        </p>
                    </div>
                    <div className="rounded-lg border p-4">
                        <div className="flex items-center space-x-2">
                            <Eye className="h-5 w-5 text-purple-500" />
                            <span className="font-medium">Published</span>
                        </div>
                        <p className="text-2xl font-bold">
                            {collections.results?.data?.filter((collection) => collection.status === 'published').length || 0}
                        </p>
                    </div>
                </div>

                <InertiaTableWrapper
                    resource={collections}
                    emptyState={{
                        title: 'No photo collections found',
                        description: 'Get started by creating your first photo collection.',
                        icons: [Camera, Image, PlusSquare],
                        action: {
                            label: 'Create Collection',
                            onClick: handleCreateCollection,
                        },
                    }}
                    onCustomAction={handleCustomAction}
                    customActions={[
                        {
                            id: 'manage-photos',
                            label: 'Manage Photos',
                            icon: 'image',
                            variant: 'secondary' as any,
                        },
                    ]}
                />
            </div>
        </AppLayout>
    );
}
