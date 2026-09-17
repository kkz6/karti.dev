import { ImageFilterProcessor, type FilterOptions } from './imageFilters';

export type FilterRequest =
    | { id: number; type: 'load'; bitmap: ImageBitmap }
    | { id: number; type: 'render'; filters: FilterOptions; preview: boolean };
export type FilterResponse = { id: number; blob?: Blob; error?: string };

let processor: ImageFilterProcessor | null = null;

// Serialize requests, including asynchronous decoding/encoding, so a reload or export
// cannot replace the backing canvas while a previous render is still using it.
let chain = Promise.resolve();
self.onmessage = (event: MessageEvent<FilterRequest>) => {
    chain = chain.then(async () => {
        const request = event.data;
        try {
            if (request.type === 'load') {
                const bitmap = request.bitmap;
                try {
                    processor = new ImageFilterProcessor(new OffscreenCanvas(bitmap.width, bitmap.height));
                    processor.loadBitmap(bitmap);
                } finally {
                    bitmap.close();
                }
                self.postMessage({ id: request.id } satisfies FilterResponse);
            } else {
                if (!processor) throw new Error('No image loaded');
                const blob = await processor.renderBlob(request.filters, request.preview);
                self.postMessage({ id: request.id, blob } satisfies FilterResponse);
            }
        } catch (error) {
            self.postMessage({ id: request.id, error: error instanceof Error ? error.message : 'Image processing failed' } satisfies FilterResponse);
        }
    });
};
