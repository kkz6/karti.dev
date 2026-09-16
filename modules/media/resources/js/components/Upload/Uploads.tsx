import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';
import { useId } from 'react';
import type { MediaUpload } from '../../types/media';
import { Upload } from './Upload';

interface UploadsProps {
    uploads: MediaUpload[];
    onClearUpload?: (uploadId: string) => void;
    onClearAll?: () => void;
}

export function Uploads({ uploads, onClearUpload, onClearAll }: UploadsProps) {
    const headingId = useId();
    if (uploads.length === 0) return null;

    const active = uploads.filter((upload) => upload.status === 'uploading').length;
    const failed = uploads.filter((upload) => upload.status === 'error').length;
    const summary = [
        active ? `${active} uploading` : null,
        failed ? `${failed} ${failed === 1 ? 'needs' : 'need'} attention` : null,
        !active && !failed ? 'All files uploaded' : null,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <section
            aria-labelledby={headingId}
            className="asset-upload-listing border-border text-foreground border-b"
        >
            <header
                className={cn(
                    'flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 pt-3 sm:px-5',
                    uploads.length === 1 && 'sr-only',
                )}
            >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 id={headingId} className="text-muted-foreground text-xs font-medium">
                        Uploads
                    </h3>
                    <p role="status" className="text-muted-foreground text-xs">
                        {summary}
                    </p>
                </div>
                {onClearAll && uploads.length > 1 && !active && (
                    <Button variant="ghost" onClick={onClearAll} className="text-muted-foreground -mr-2">
                        Dismiss all
                    </Button>
                )}
            </header>
            <ul className="divide-border/60 max-h-72 divide-y overflow-y-auto overscroll-contain">
                {uploads.map((upload) => (
                    <Upload key={upload.id} upload={upload} onClear={onClearUpload ? () => onClearUpload(upload.id) : undefined} />
                ))}
            </ul>
        </section>
    );
}
