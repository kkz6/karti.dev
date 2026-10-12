import { ChevronRight, Image, LockKeyhole } from 'lucide-react';
import { compressionSummary } from './image-processing-summary';
import type { CompressionDefaults, ImagePreset } from './media-settings';

const presetNames: Record<string, string> = {
    thumb: 'Media thumbnails',
    card: 'Gallery cards',
    content: 'Article images',
};
const optimizerLabels: Record<string, string> = {
    Jpegoptim: 'JPEG',
    Pngquant: 'PNG compression',
    Optipng: 'PNG optimization',
    Gifsicle: 'GIF',
    Cwebp: 'WebP',
    Avifenc: 'AVIF',
};

export function ImageProcessingDefaults({ presets }: { presets: ImagePreset[] }) {
    return (
        <section aria-labelledby="image-defaults-heading">
            <div className="mb-3 flex items-center gap-3">
                <h2 id="image-defaults-heading" className="text-sm font-semibold">
                    Default image sizes
                </h2>
                <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <LockKeyhole className="size-3" aria-hidden="true" />
                    Read-only
                </span>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">These standard sizes are generated automatically for every image upload.</p>
            <div className="grid gap-3 sm:grid-cols-3">
                {presets.map((preset) => (
                    <div key={preset.name} className="bg-card space-y-3 rounded-xl border p-4">
                        <div className="flex items-center gap-2">
                            <Image className="text-muted-foreground size-4" />
                            <h3 className="text-sm font-medium">{presetNames[preset.name] ?? preset.name}</h3>
                        </div>
                        <p className="text-lg font-semibold tabular-nums">
                            {preset.height ? `${preset.width} × ${preset.height}` : preset.width}
                            <span className="text-muted-foreground ml-1 text-xs font-normal">{preset.height ? 'px' : 'px wide'}</span>
                        </p>
                        <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
                            <span>{preset.format === 'webp' ? 'WebP' : preset.format === 'jpg' ? 'JPEG' : preset.format.toUpperCase()}</span>
                            <span>{preset.format === 'png' ? 'Lossless' : `${preset.quality}% quality`}</span>
                            <span>{preset.fit === 'cover' ? 'Crop to fit' : 'Keep proportions'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function ServerCompressionDefaults({ compression }: { compression: CompressionDefaults }) {
    return (
        <details className="group bg-card rounded-xl border p-4">
            <summary className="text-muted-foreground hover:text-foreground flex w-fit cursor-pointer list-none items-center gap-1.5 py-2 text-xs focus-visible:outline-2">
                <ChevronRight className="size-3.5 transition-transform group-open:rotate-90" aria-hidden="true" />
                Advanced compression defaults
            </summary>
            <div className="mt-3 pb-2">
                <p className="text-muted-foreground mb-4 text-xs leading-relaxed">
                    Read-only server settings. The image sizes above use their own quality, not these fallback settings.
                </p>
                <dl className="divide-border/50 divide-y text-sm">
                    <div className="flex justify-between gap-4 py-2">
                        <dt>Fallback quality</dt>
                        <dd className="tabular-nums">{compression.encodingQuality}%</dd>
                    </div>
                    <div className="flex justify-between gap-4 py-2">
                        <dt>Server optimization</dt>
                        <dd>{compression.enabled ? 'Enabled' : 'Disabled'}</dd>
                    </div>
                    {compression.optimizers.map(({ name, options }) => {
                        const summary = compressionSummary(name, options);
                        return (
                            <div key={name} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2">
                                <dt>{optimizerLabels[name] ?? name}</dt>
                                <dd className="text-muted-foreground tabular-nums">
                                    {summary.setting}: <span className="text-foreground">{summary.value}</span>
                                </dd>
                            </div>
                        );
                    })}
                </dl>
            </div>
        </details>
    );
}
