import { Head } from '@inertiajs/react';
import { IndexHeader } from '@shared/components/index-header';
import { LocalTrafficCard } from '@shared/components/local-traffic-card';
import { PageContainer } from '@shared/components/page-container';
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
            <PageContainer className="content-index flex flex-col gap-8">
                <IndexHeader title="Photography" icon={Camera} actions={<Button onClick={handleCreateGallery}>Create gallery</Button>} />
                <LocalTrafficCard compact />

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
            </PageContainer>
        </AppLayout>
    );
}
