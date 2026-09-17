import type { FilterRequest, FilterResponse } from './image-filter.worker';
import type { FilterOptions } from './imageFilters';

export class ImageFilterClient {
    private worker: Worker;
    private sequence = 0;
    private disposed = false;
    private pending = new Map<
        number,
        { resolve: (response: FilterResponse) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }
    >();
    public originalUrl = '';

    constructor() {
        this.worker = new Worker(new URL('./image-filter.worker.ts', import.meta.url), { type: 'module' });
        this.worker.onmessage = ({ data }: MessageEvent<FilterResponse>) => {
            const request = this.pending.get(data.id);
            if (!request) return;
            clearTimeout(request.timer);
            this.pending.delete(data.id);
            if (data.error) request.reject(new Error(data.error));
            else request.resolve(data);
        };
        this.worker.onerror = () => this.dispose(new Error('Background image processing is unavailable. Please reload the editor.'));
        this.worker.onmessageerror = () => this.dispose(new Error('Could not read the processed image.'));
    }

    private request(message: Omit<Extract<FilterRequest, { type: 'load' }>, 'id'> | Omit<Extract<FilterRequest, { type: 'render' }>, 'id'>) {
        if (this.disposed) return Promise.reject(new Error('Image processor is closed'));
        const id = ++this.sequence;
        return new Promise<FilterResponse>((resolve, reject) => {
            const timer = setTimeout(() => this.dispose(new Error('Image processing timed out. Please reopen the editor.')), 60000);
            this.pending.set(id, { resolve, reject, timer });
            try {
                this.worker.postMessage({ ...message, id }, message.type === 'load' ? [message.bitmap] : []);
            } catch (error) {
                clearTimeout(timer);
                this.pending.delete(id);
                reject(error);
            }
        });
    }

    async loadImage(source: string) {
        // Use the same decoder and orientation as the cropper, including for SVG.
        // Transferring the bitmap avoids copying pixels on the UI thread.
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = source;
        await image.decode();
        if (this.disposed) throw new Error('Image processor is closed');
        const bitmap = await createImageBitmap(image);
        try {
            await this.request({ type: 'load', bitmap });
            this.originalUrl = source;
        } finally {
            bitmap.close();
        }
    }

    async render(filters: FilterOptions, preview = true) {
        const response = await this.request({ type: 'render', filters, preview });
        if (!response.blob) throw new Error('No image returned');
        return response.blob;
    }

    dispose(error = new Error('Image processor is closed')) {
        this.disposed = true;
        this.worker.terminate();
        for (const request of this.pending.values()) {
            clearTimeout(request.timer);
            request.reject(error);
        }
        this.pending.clear();
    }
}
