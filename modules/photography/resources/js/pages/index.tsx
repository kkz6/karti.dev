import { Head } from '@inertiajs/react';
import { Button } from '@shared/components/ui/button';
import AppLayout from '@shared/layouts/app-layout';
import { type BreadcrumbItem } from '@shared/types';
import { InertiaTableWrapper, type TableConfig } from '@table/components';
import { Camera, Image, PlusSquare } from 'lucide-react';
import { type PhotoGallery } from '../types';

export default function Index({ photos }: { photos: TableConfig<PhotoGallery> }) {
    const breadcrumbs: BreadcrumbItem[] = [{ title: 'Photography', href: route('admin.photography.index') }];

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
                />
            </div>
        </AppLayout>
    );
}
