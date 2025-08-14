import { Head } from '@inertiajs/react';
import AppLayout from '@shared/layouts/app-layout';

import { MediaManager } from '@media/components/MediaManager';

export default function MediaIndex() {
    const breadcrumbs = [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Media Manager', href: '/media', isCurrentPage: true }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Media Manager" />

            <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Media Manager</h1>
                    <p className="text-muted-foreground">
                        Manage your files and media assets
                    </p>
                </div>
                
                <div className="flex-1 min-h-0">
                    <MediaManager />
                </div>
            </div>
        </AppLayout>
    );
}
