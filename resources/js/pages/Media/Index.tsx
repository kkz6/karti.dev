import { Head } from '@inertiajs/react';
import AppLayout from '@shared/layouts/app-layout';

import { MediaManager } from '@media/components/MediaManager';

interface MediaPageProps {
    config: {
        baseUrl: string;
        hideFilesExt: boolean;
        mimeTypes: Record<string, string[]>;
        broadcasting: boolean;
        gfi: boolean;
        ratioBar: boolean;
        previewFilesBeforeUpload: boolean;
    };
    routes: {
        files: string;
        upload: string;
        lock: string;
        visibility: string;
        locked_list: string;
    };
    translations: Record<string, string>;
}

export default function MediaIndex({ config, routes, translations }: MediaPageProps) {
    return (
        <AppLayout>
            <Head title="Media Manager" />

            <div className="h-full">
                <MediaManager config={config} routes={routes} translations={translations} inModal={false} />
            </div>
        </AppLayout>
    );
}
