// Limit simultaneous uploads so large batches cannot monopolize browser/server connections.
export function createUploadQueue(concurrency = 2) {
    const pending: Array<() => Promise<void>> = [];
    let active = 0;
    const drain = () => {
        while (active < concurrency && pending.length) {
            const task = pending.shift()!;
            active++;
            void task()
                .catch(() => undefined)
                .finally(() => {
                    active--;
                    drain();
                });
        }
    };
    return {
        add(task: () => Promise<void>) {
            pending.push(task);
            drain();
        },
        clear() {
            pending.length = 0;
        },
    };
}

export function normalizeUploadPath(path?: string | null) {
    return (path ?? '').replace(/^\/+|\/+$/g, '');
}

export function confirmedUpload(data: unknown, path: string): { id: string; directory: string; url: string } {
    const asset = Array.isArray(data) ? data[0] : data;
    if (
        !asset ||
        typeof asset !== 'object' ||
        !asset.id ||
        typeof asset.url !== 'string' ||
        typeof asset.directory !== 'string' ||
        normalizeUploadPath(asset.directory) !== normalizeUploadPath(path)
    ) {
        throw new Error('The server did not confirm the file in the requested folder. Refresh the library before trying again.');
    }
    return asset;
}
