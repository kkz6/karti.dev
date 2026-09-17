import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, ImageOff, LoaderCircle, X } from 'lucide-react';
import { useState, type RefObject } from 'react';

interface GalleryImage {
    full_url: string;
    alt: string;
}

interface GalleryLightboxProps {
    title: string;
    images: GalleryImage[];
    index: number | null;
    onIndexChange: (index: number) => void;
    onClose: () => void;
    returnFocusRef: RefObject<HTMLButtonElement | null>;
}

// Keep the viewer controls independent of the page theme and the photograph's colors.
const controlClass =
    'inline-flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/25 bg-zinc-800 text-white shadow-lg transition-colors hover:bg-zinc-700 active:bg-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none';

function FullSizeImage({ image }: { image: GalleryImage }) {
    const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

    return (
        <>
            {status !== 'loaded' && (
                <div
                    className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-zinc-200"
                    role="status"
                >
                    {status === 'loading' ? (
                        <LoaderCircle className="size-6 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                    ) : (
                        <ImageOff className="size-7" aria-hidden="true" />
                    )}
                    {status === 'loading' ? 'Loading full-size photo…' : 'This photo could not be loaded.'}
                </div>
            )}
            <img
                src={image.full_url}
                alt={image.alt}
                onLoad={() => setStatus('loaded')}
                onError={() => setStatus('error')}
                className={`max-h-full max-w-full object-contain ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
            />
        </>
    );
}

export function GalleryLightbox({ title, images, index, onIndexChange, onClose, returnFocusRef }: GalleryLightboxProps) {
    const navigate = (direction: number) => {
        if (index !== null && images.length > 1) {
            onIndexChange((index + direction + images.length) % images.length);
        }
    };

    return (
        <Dialog.Root
            open={index !== null}
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-zinc-950" />
                <Dialog.Content
                    aria-describedby={undefined}
                    className="fixed inset-0 z-[var(--z-overlay)] flex h-dvh flex-col text-white outline-none"
                    onCloseAutoFocus={(event) => {
                        event.preventDefault();
                        returnFocusRef.current?.focus({ preventScroll: true });
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                            event.preventDefault();
                            navigate(event.key === 'ArrowLeft' ? -1 : 1);
                        }
                    }}
                >
                    <header className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
                        <Dialog.Title className="min-w-0 truncate text-sm font-medium text-zinc-100">{title}</Dialog.Title>
                        <Dialog.Close className={controlClass} aria-label="Close photo viewer" title="Close (Esc)">
                            <X className="size-5" aria-hidden="true" />
                        </Dialog.Close>
                    </header>

                    <div
                        className="relative flex min-h-0 flex-1 items-center justify-center px-3 sm:px-20"
                        onClick={(event) => {
                            if (event.target === event.currentTarget) onClose();
                        }}
                    >
                        {index !== null && images[index] && <FullSizeImage key={images[index].full_url} image={images[index]} />}
                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className={`${controlClass} absolute top-1/2 left-3 -translate-y-1/2 sm:left-6`}
                                    onClick={() => navigate(-1)}
                                    aria-label="Previous photo"
                                    title="Previous photo (←)"
                                >
                                    <ChevronLeft className="size-6" aria-hidden="true" />
                                </button>
                                <button
                                    type="button"
                                    className={`${controlClass} absolute top-1/2 right-3 -translate-y-1/2 sm:right-6`}
                                    onClick={() => navigate(1)}
                                    aria-label="Next photo"
                                    title="Next photo (→)"
                                >
                                    <ChevronRight className="size-6" aria-hidden="true" />
                                </button>
                            </>
                        )}
                    </div>

                    <footer className="flex shrink-0 items-center justify-center gap-4 px-4 py-4 text-sm text-zinc-200">
                        <span role="status" aria-live="polite" aria-atomic="true" className="font-mono tabular-nums">
                            {index !== null ? index + 1 : 0} <span className="text-zinc-400">/</span> {images.length}
                            <span className="sr-only"> photos</span>
                        </span>
                        {images.length > 1 && (
                            <span className="hidden border-l border-white/20 pl-4 text-xs text-zinc-400 sm:inline">Use ← → to browse</span>
                        )}
                    </footer>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
