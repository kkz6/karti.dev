import type { MediaAsset } from '@media/types/media';
import { Camera } from 'lucide-react';

export function PhotoDetails({ asset }: { asset: MediaAsset }) {
    const metadata = asset.photo_metadata;
    const fields = metadata?.fields ?? {};
    const model = fields.camera_model;
    const make = fields.camera_make;
    const camera = make && model?.toLowerCase().startsWith(make.toLowerCase()) ? model : [make, model].filter(Boolean).join(' ');
    const exposure = fields.exposure_seconds;
    const rows = [
        ['Dimensions', asset.dimensions ? `${asset.dimensions.width} × ${asset.dimensions.height} px` : null],
        ['Camera', camera],
        ['Lens', fields.lens],
        ['Shutter speed', exposure ? (exposure < 1 ? `1/${Number((1 / exposure).toPrecision(3))} s` : `${exposure} s`) : null],
        ['Aperture', fields.aperture ? `f/${fields.aperture}` : null],
        ['ISO', fields.iso?.toString()],
        ['Focal length', fields.focal_length ? `${fields.focal_length} mm` : null],
        ['Captured (camera time)', fields.taken_at],
    ].filter(([, value]) => Boolean(value));
    const message =
        metadata?.status === 'pending'
            ? 'Reading photo details in the background…'
            : metadata?.status === 'unavailable'
              ? 'Camera details require the PHP EXIF extension on the server.'
              : metadata?.status === 'error'
                ? 'Photo details could not be read. Reopen this image to try again.'
                : metadata?.status === 'unsupported'
                  ? 'Camera details are currently read from JPEG and TIFF originals.'
                  : !camera && !fields.lens && !exposure && !fields.aperture && !fields.iso && !fields.focal_length && !fields.taken_at
                    ? 'No camera details found. They may have been removed when this image was exported.'
                    : null;

    return (
        <section aria-label="Photo details" className="border-border/60 border-t pt-5">
            <div className="mb-4 flex items-center gap-2">
                <Camera className="text-muted-foreground size-4" aria-hidden="true" />
                <h3 className="text-sm font-semibold">Photo details</h3>
                <span className="text-muted-foreground ml-auto text-xs">Read-only</span>
            </div>
            {rows.length > 0 && (
                <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    {rows.map(([label, value]) => (
                        <div key={label} className="min-w-0">
                            <dt className="text-muted-foreground text-xs">{label}</dt>
                            <dd className="mt-1 text-sm break-words tabular-nums">{value}</dd>
                        </div>
                    ))}
                </dl>
            )}
            {message && (
                <p role="status" className="text-muted-foreground mt-3 text-xs leading-relaxed">
                    {message}
                </p>
            )}
        </section>
    );
}
