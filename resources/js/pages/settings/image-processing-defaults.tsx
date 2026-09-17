import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@shared/components/ui/table';
import { ChevronRight, LockKeyhole } from 'lucide-react';
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
            <Table
                aria-label="Read-only default image sizes and quality"
                className="table-fixed sm:table-auto [&_td]:px-2 sm:[&_td]:px-3 [&_th]:px-2 sm:[&_th]:px-3"
            >
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[34%] sm:w-auto">Use</TableHead>
                        <TableHead className="w-[30%] sm:w-auto">Size</TableHead>
                        <TableHead className="w-[18%] sm:w-auto">Format</TableHead>
                        <TableHead className="w-[18%] text-right sm:w-auto">Quality</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {presets.map((preset) => (
                        <TableRow key={preset.name} className="hover:bg-transparent">
                            <TableCell className="py-4 font-medium whitespace-normal">{presetNames[preset.name] ?? preset.name}</TableCell>
                            <TableCell className="whitespace-normal tabular-nums">
                                {preset.height ? `${preset.width} × ${preset.height} px` : `${preset.width}px wide`}
                                {preset.fit === 'cover' && <span className="text-muted-foreground ml-1 text-xs">· crop</span>}
                            </TableCell>
                            <TableCell>
                                {preset.format === 'webp' ? 'WebP' : preset.format === 'jpg' ? 'JPEG' : preset.format.toUpperCase()}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{preset.format === 'png' ? 'Lossless' : `${preset.quality}%`}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </section>
    );
}

export function ServerCompressionDefaults({ compression }: { compression: CompressionDefaults }) {
    return (
        <details className="group border-border/60 border-t pt-3">
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
