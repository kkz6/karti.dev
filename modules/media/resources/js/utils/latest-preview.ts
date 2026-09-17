type PreviewOptions<T, R> = {
    render: (value: T) => Promise<R>;
    commit: (result: R, isCurrent: () => boolean) => Promise<void>;
    busy: (busy: boolean) => void;
    error: (error: unknown) => void;
    delay?: number;
};

/** One render in flight, one replaceable pending value. Stale results never commit. */
export class LatestPreview<T, R> {
    private revision = 0;
    private pending: { value: T; revision: number } | null = null;
    private running = false;
    private disposed = false;
    private timer?: ReturnType<typeof setTimeout>;

    private options: PreviewOptions<T, R>;

    constructor(options: PreviewOptions<T, R>) {
        this.options = options;
    }

    schedule(value: T) {
        if (this.disposed) return;
        this.pending = { value, revision: ++this.revision };
        this.options.busy(true);
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.timer = undefined;
            void this.run();
        }, this.options.delay ?? 80);
    }

    cancel() {
        ++this.revision;
        this.pending = null;
        clearTimeout(this.timer);
        this.timer = undefined;
        if (!this.disposed) this.options.busy(false);
    }

    dispose() {
        this.disposed = true;
        this.cancel();
    }

    private async run() {
        if (this.running || this.disposed || !this.pending) return;
        const job = this.pending;
        this.pending = null;
        this.running = true;
        const isCurrent = () => !this.disposed && job.revision === this.revision;
        try {
            const result = await this.options.render(job.value);
            if (isCurrent()) await this.options.commit(result, isCurrent);
        } catch (error) {
            if (isCurrent()) this.options.error(error);
        } finally {
            this.running = false;
            if (!this.disposed && this.pending && !this.timer) void this.run();
            else if (isCurrent() && !this.pending) this.options.busy(false);
        }
    }
}
