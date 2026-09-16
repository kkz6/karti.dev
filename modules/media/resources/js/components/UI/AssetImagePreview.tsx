import { cn } from '@shared/lib/utils';
import { ImageIcon, ImageOff } from 'lucide-react';
import { useCallback, useState } from 'react';

interface AssetImagePreviewProps {
    src?: string | null;
    alt: string;
    className?: string;
    fit?: 'cover' | 'contain';
    compact?: boolean;
    eager?: boolean;
}

// A new source gets a fresh loading state, including when replacing an existing asset.
export function AssetImagePreview(props: AssetImagePreviewProps) {
    return <PreviewImage key={props.src} {...props} />;
}

function PreviewImage({ src, alt, className, fit = 'cover', compact = false, eager = false }: AssetImagePreviewProps) {
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(src ? 'loading' : 'error');
    const handleImageRef = useCallback((image: HTMLImageElement | null) => {
        if (image?.complete) setStatus(image.naturalWidth > 0 ? 'ready' : 'error');
    }, []);

    return (
        <span
            className={cn('bg-muted/50 relative block h-full w-full overflow-hidden', className)}
            aria-busy={status === 'loading'}
            data-preview-state={status}
        >
            {status !== 'ready' && (
                <span
                    role="img"
                    aria-label={`${status === 'error' ? 'Preview unavailable' : 'Loading preview'}: ${alt}`}
                    className={cn(
                        'text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2 p-2',
                        status === 'loading' && 'motion-safe:animate-pulse',
                    )}
                >
                    {status === 'error' ? (
                        <ImageOff aria-hidden="true" className={compact ? 'size-4' : 'size-6'} />
                    ) : (
                        <ImageIcon aria-hidden="true" className={compact ? 'size-4 opacity-40' : 'size-6 opacity-40'} />
                    )}
                    {!compact && (
                        <span aria-hidden="true" className="text-center text-xs">
                            {status === 'error' ? 'Preview unavailable' : 'Loading preview…'}
                        </span>
                    )}
                </span>
            )}
            {src && status !== 'error' && (
                <img
                    ref={handleImageRef}
                    src={src}
                    alt={alt}
                    loading={eager ? 'eager' : 'lazy'}
                    decoding="async"
                    onLoad={() => setStatus('ready')}
                    onError={() => setStatus('error')}
                    className={cn(
                        'absolute inset-0 h-full w-full motion-safe:transition-opacity motion-safe:duration-200',
                        fit === 'contain' ? 'object-contain' : 'object-cover',
                        status === 'ready' ? 'opacity-100' : 'opacity-0',
                    )}
                />
            )}
        </span>
    );
}
