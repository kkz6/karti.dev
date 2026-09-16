import { Upload } from 'lucide-react';

/** Covers the existing field without adding height or intercepting drag events. */
export function AssetDropOverlay() {
    return (
        <div
            role="status"
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center gap-2 rounded-[inherit] border border-dashed border-muted-foreground/60 bg-background/90 p-3 text-sm font-medium text-foreground"
        >
            <Upload className="size-5 shrink-0" aria-hidden="true" />
            <span>Drop to upload</span>
        </div>
    );
}
