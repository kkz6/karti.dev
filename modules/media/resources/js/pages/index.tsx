import { Head } from '@inertiajs/react';
import AppLayout from '@shared/layouts/app-layout';
import { Toaster } from 'sonner';
import { AssetManager } from '../components/AssetManager';

export default function MediaIndex() {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Media Manager', href: '/media' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Media Manager" />
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1">
                    <AssetManager />
                </div>
            </div>
            <Toaster />
        </AppLayout>
    );
}
