export function AssetFieldLoading() {
    return (
        <div role="status" aria-label="Loading selected assets" className="space-y-4 p-4">
            <div aria-hidden="true" className="flex gap-2 motion-safe:animate-pulse">
                <div className="bg-muted h-9 w-32 rounded-md" />
                <div className="bg-muted h-9 w-24 rounded-md" />
            </div>
            <div aria-hidden="true" className="w-32 space-y-2 motion-safe:animate-pulse">
                <div className="bg-muted/60 aspect-square rounded-md" />
                <div className="bg-muted h-3 w-24 rounded" />
            </div>
            <span className="sr-only">Loading selected assets…</span>
        </div>
    );
}
