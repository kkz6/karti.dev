import { Head } from '@inertiajs/react';
import { PageContainer } from '@shared/components/page-container';
import AppLayout from '@shared/layouts/app-layout';
import { Toaster } from 'sonner';
import { AssetManager } from '../components/Browser/AssetManager';

export default function MediaIndex() {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Media Manager', href: '/admin/media-manager' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Media Manager" />
            <PageContainer padding="compact" className="content-index media-index flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1">
                    <AssetManager />
                </div>
            </PageContainer>
            <Toaster />
        </AppLayout>
    );
}
