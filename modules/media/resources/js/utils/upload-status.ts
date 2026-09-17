import type { MediaUpload } from '../types/media';

export function uploadPresentation(upload: MediaUpload) {
    const failed = upload.status === 'error';
    const completed = upload.status === 'complete' || upload.status === 'completed';
    const progress = Number.isFinite(upload.progress) ? Math.min(100, Math.max(0, upload.progress)) : 0;
    const duplicate = failed && /^A file named .+ already exists in this folder\.$/.test(upload.error ?? '');

    return {
        failed,
        completed,
        progress,
        label: failed
            ? upload.unconfirmed
                ? 'Check destination'
                : 'Not uploaded'
            : completed
              ? 'Uploaded'
              : upload.status === 'queued'
                ? 'Queued'
                : progress === 100
                  ? 'Saving…'
                  : `Uploading · ${progress}%`,
        message: failed
            ? duplicate
                ? 'A file with this name is already in this folder. Rename your file or choose the existing asset.'
                : upload.error || 'The upload could not be completed. Try uploading this file again.'
            : null,
    };
}
