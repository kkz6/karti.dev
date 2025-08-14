import { Head } from '@inertiajs/react';
import AppLayout from '@shared/layouts/app-layout';
import { AssetManager } from '../components/AssetManager';

export default function MediaIndex() {
    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Media Manager', href: '/media' }
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Media Manager" />
            <div className="flex-1 flex flex-col overflow-hidden">    
                <div className="flex-1 min-h-0">
                    <AssetManager />
                </div>
            </div>
        </AppLayout>
    );
}
