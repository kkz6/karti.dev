import { MediaAsset } from '@media/types/media';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import axios from 'axios';
import { Columns2, ImageOff, Loader2, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AssetImagePreview } from '../UI/AssetImagePreview';
import { FilterPresets } from './FilterPresets';
import { ImageControls } from './ImageControls';
import { ImageFilters } from './ImageFilters';
import { SaveDropdown } from './SaveDropdown';

import '@media/../css/image-editor.css';
import { hasImageTransform, imageExportBounds } from '@media/utils/image-export';
import { ImageFilterClient } from '@media/utils/image-filter-client';
import { FilterOptions } from '@media/utils/imageFilters';
import { LatestPreview } from '@media/utils/latest-preview';
import 'cropperjs';
import type { CropperCanvas, CropperHandle, CropperImage, CropperSelection } from 'cropperjs';
import {
    ACTION_MOVE,
    ACTION_RESIZE_EAST,
    ACTION_RESIZE_NORTH,
    ACTION_RESIZE_NORTHEAST,
    ACTION_RESIZE_NORTHWEST,
    ACTION_RESIZE_SOUTH,
    ACTION_RESIZE_SOUTHEAST,
    ACTION_RESIZE_SOUTHWEST,
    ACTION_RESIZE_WEST,
    ACTION_SELECT,
} from 'cropperjs';

type CropperImageElement = CropperImage;
type CropperSelectionElement = CropperSelection;
type CropperCanvasElement = CropperCanvas;
type CropperHandleElement = CropperHandle;

const flipImage = (cropperImage: CropperImage, direction: 'horizontal' | 'vertical'): void => {
    if (direction === 'horizontal') {
        cropperImage.$scale(-1, 1);
    } else {
        cropperImage.$scale(1, -1);
    }
};

interface ImageEditorProps {
    asset: MediaAsset | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved?: (asset: MediaAsset) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ asset, isOpen, onClose, onSaved }) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const [editorError, setEditorError] = useState('');
    const [imageFailed, setImageFailed] = useState(false);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const [saving, setSaving] = useState(false);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [previewPending, setPreviewPending] = useState(false);
    const [previewFailed, setPreviewFailed] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [hasChanged, setHasChanged] = useState(false);
    const [dragMode, setDragMode] = useState<'move' | 'crop'>('move');
    const [croppedByUser, setCroppedByUser] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
    const [editedImageUrl, setEditedImageUrl] = useState<string>('');
    const [camanFilters, setCamanFilters] = useState<FilterOptions>({});

    const cropperCanvasRef = useRef<CropperCanvasElement>(null);
    const cropperImageRef = useRef<CropperImageElement>(null);
    const cropperSelectionRef = useRef<CropperSelectionElement>(null);
    const cropperHandleRef = useRef<CropperHandleElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const filterProcessorRef = useRef<ImageFilterClient | null>(null);
    const previewQueueRef = useRef<LatestPreview<FilterOptions, Blob | string> | null>(null);
    const filtersRef = useRef<FilterOptions>({});
    const previewUrlRef = useRef<string | null>(null);

    const centerImage = useCallback(() => {
        const cropperImage = cropperImageRef.current;
        if (!cropperImage) return;

        try {
            // Center the image with contain mode to fit it in the viewport
            cropperImage.$center('contain');
        } catch (error) {
            console.warn('Error centering image:', error);
            // Fallback: try to center without mode
            try {
                cropperImage.$center();
            } catch (e) {
                console.warn('Fallback center also failed:', e);
            }
        }
    }, []);

    const cleanup = useCallback(() => {
        setProcessing(false);
        setImageLoading(false);
        setHasChanged(false);
        setDragMode('move');
        setCroppedByUser(false);
        setShowDiff(false);
        setOriginalImageUrl('');
        setEditedImageUrl('');
        setCamanFilters({});
        filtersRef.current = {};
        setPreviewPending(false);
        setPreviewFailed(false);

        if (filterProcessorRef.current) {
            filterProcessorRef.current.dispose();
            filterProcessorRef.current = null;
        }

        const cropperImage = cropperImageRef.current;
        const cropperSelection = cropperSelectionRef.current;
        const cropperHandle = cropperHandleRef.current;

        if (cropperImage) {
            try {
                cropperImage.$resetTransform();
                cropperImage.$image.src = '';
            } catch {
                // Cropper elements may already be disconnected during cleanup.
            }
        }

        if (cropperSelection) {
            try {
                cropperSelection.$reset();
                cropperSelection.hidden = true;
            } catch {
                // Cropper elements may already be disconnected during cleanup.
            }
        }

        if (cropperHandle) {
            try {
                cropperHandle.action = ACTION_MOVE;
            } catch {
                // Cropper elements may already be disconnected during cleanup.
            }
        }
    }, []);

    useEffect(() => {
        if (!isOpen || !asset) {
            cleanup();
            return;
        }

        let active = true;
        let processor: ImageFilterClient;
        try {
            processor = new ImageFilterClient();
        } catch {
            setImageFailed(true);
            setEditorError('Background image processing is unavailable in this browser. Please try an up-to-date browser.');
            return;
        }
        filterProcessorRef.current = processor;
        filtersRef.current = {};
        setCamanFilters({});
        setPreviewFailed(false);
        setPreviewPending(false);
        const queue = new LatestPreview<FilterOptions, Blob | string>({
            render: (filters) => (Object.keys(filters).length ? processor.render(filters) : Promise.resolve(processor.originalUrl)),
            commit: async (result, isCurrent) => {
                const url = typeof result === 'string' ? result : URL.createObjectURL(result);
                let retained = false;
                try {
                    const decoded = new Image();
                    decoded.src = url;
                    await decoded.decode();
                    const cropperImage = cropperImageRef.current;
                    if (!isCurrent() || !cropperImage) return;
                    const transform = cropperImage.$getTransform();
                    cropperImage.$image.src = url;
                    await cropperImage.$ready();
                    // A newer slider value may arrive during decoding. Restore this
                    // frame's geometry unless reset/close has replaced its source.
                    if (!active || cropperImage.$image.src !== decoded.src) return;
                    cropperImage.$setTransform(transform);
                    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
                    previewUrlRef.current = typeof result === 'string' ? null : url;
                    retained = true;
                } finally {
                    if (!retained && typeof result !== 'string') URL.revokeObjectURL(url);
                }
            },
            busy: setPreviewPending,
            error: () => {
                setPreviewFailed(true);
                setEditorError('Could not update the preview. Adjust a setting to retry, or reset the filters.');
            },
        });
        previewQueueRef.current = queue;
        setImageLoading(true);
        setImageFailed(false);
        setEditorError('');
        setOriginalImageUrl(asset.url);

        Promise.all([processor.loadImage(asset.url), cropperImageRef.current?.$ready()])
            .then(() => {
                if (!active) return;
                centerImage();
                setHasChanged(false);
                setImageLoading(false);
            })
            .catch(() => {
                if (!active) return;
                setImageFailed(true);
                setImageLoading(false);
                setEditorError('We could not open this image. Check the file or try loading it again.');
            });

        return () => {
            active = false;
            queue.dispose();
            processor.dispose();
            if (previewQueueRef.current === queue) previewQueueRef.current = null;
            if (filterProcessorRef.current === processor) filterProcessorRef.current = null;
            if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        };
    }, [isOpen, asset, loadAttempt, centerImage, cleanup]);

    useEffect(() => {
        if (!isOpen || !containerRef.current) return;
        const observer = new ResizeObserver(() => {
            if (!imageLoading) centerImage();
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [isOpen, imageLoading, centerImage]);

    const checkForChanges = useCallback(() => {
        const cropperImage = cropperImageRef.current;
        const cropperSelection = cropperSelectionRef.current;
        if (!cropperImage) return;

        const matrix = cropperImage.$getTransform();
        const hasFilters = Object.keys(camanFilters).length > 0;
        const hasCrop = cropperSelection ? cropperSelection.width > 0 && cropperSelection.height > 0 && !cropperSelection.hidden : false;
        const hasTransform = hasImageTransform(matrix);

        setHasChanged(hasTransform || hasCrop || hasFilters);
    }, [camanFilters]);

    useEffect(() => {
        checkForChanges();
    }, [checkForChanges]);

    const resetAll = useCallback(() => {
        const cropperImage = cropperImageRef.current;
        const cropperSelection = cropperSelectionRef.current;
        const cropperHandle = cropperHandleRef.current;
        if (!cropperImage) return;

        setDragMode('move');
        setHasChanged(false);
        setCroppedByUser(false);
        setCamanFilters({});
        filtersRef.current = {};
        previewQueueRef.current?.cancel();
        setPreviewFailed(false);
        setShowDiff(false);
        setEditorError('');

        cropperImage.$resetTransform();
        setTimeout(() => centerImage(), 100);

        if (cropperSelection) {
            cropperSelection.$reset();
            cropperSelection.hidden = true;
        }

        if (cropperHandle) {
            cropperHandle.action = ACTION_MOVE;
        }

        if (filterProcessorRef.current) {
            const originalImageUrl = filterProcessorRef.current.originalUrl;
            cropperImage.$image.src = originalImageUrl;
        }
    }, [centerImage]);

    const handleOperation = useCallback(
        (action: string) => {
            const cropperImage = cropperImageRef.current;
            const cropperSelection = cropperSelectionRef.current;
            const cropperHandle = cropperHandleRef.current;

            if (!cropperImage) return;

            switch (action) {
                case 'move':
                    setDragMode('move');
                    if (cropperHandle) cropperHandle.action = ACTION_MOVE;
                    return;

                case 'crop':
                    setDragMode('crop');
                    if (cropperHandle) cropperHandle.action = ACTION_SELECT;
                    return;

                case 'zoom-in':
                    cropperImage.$zoom(0.1);
                    setHasChanged(true);
                    break;

                case 'zoom-out':
                    cropperImage.$zoom(-0.1);
                    setHasChanged(true);
                    break;

                case 'rotate-left':
                    cropperImage.$rotate('-90deg');
                    setHasChanged(true);
                    break;

                case 'rotate-right':
                    cropperImage.$rotate('90deg');
                    setHasChanged(true);
                    break;

                case 'flip-horizontal':
                    flipImage(cropperImage, 'horizontal');
                    setHasChanged(true);
                    break;

                case 'flip-vertical':
                    flipImage(cropperImage, 'vertical');
                    setHasChanged(true);
                    break;

                case 'reset':
                    resetAll();
                    return;

                case 'clear':
                    setCroppedByUser(false);
                    setShowDiff(false);
                    if (cropperSelection) {
                        cropperSelection.hidden = true;
                        cropperSelection.$reset();
                    }
                    setHasChanged(false);
                    break;
            }

            checkForChanges();
        },
        [checkForChanges, resetAll],
    );

    const getCropperData = useCallback(
        async (fullQuality = false) => {
            const selection = cropperSelectionRef.current;
            const cropperImage = cropperImageRef.current;
            if (!asset || !cropperImage) return null;

            let image = await cropperImage.$ready();
            let exportUrl: string | undefined;
            try {
                // Preview JPEGs are never used as the source for a saved file.
                if (fullQuality && Object.keys(filtersRef.current).length && filterProcessorRef.current) {
                    const blob = await filterProcessorRef.current.render(filtersRef.current, false);
                    exportUrl = URL.createObjectURL(blob);
                    image = new Image();
                    image.src = exportUrl;
                    await image.decode();
                }
                const matrix = cropperImage.$getTransform();
                const crop =
                    croppedByUser && selection && !selection.hidden && selection.width > 0 && selection.height > 0
                        ? { x: selection.x, y: selection.y, width: selection.width, height: selection.height }
                        : undefined;
                const bounds = imageExportBounds(image.naturalWidth, image.naturalHeight, matrix, crop);
                const canvas = document.createElement('canvas');
                canvas.width = bounds.outputWidth;
                canvas.height = bounds.outputHeight;
                const context = canvas.getContext('2d');
                if (!context) throw new Error('Image export is unavailable');

                if (!asset.mime_type?.includes('png') && !asset.mime_type?.includes('webp')) {
                    context.fillStyle = '#fff';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                }
                context.scale(canvas.width / bounds.width, canvas.height / bounds.height);
                context.translate(-bounds.x, -bounds.y);
                context.translate(image.naturalWidth / 2, image.naturalHeight / 2);
                context.transform(...(matrix as [number, number, number, number, number, number]));
                context.translate(-image.naturalWidth / 2, -image.naturalHeight / 2);
                context.drawImage(image, 0, 0);
                const blob = await new Promise<Blob>((resolve, reject) =>
                    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Could not encode image'))), asset.mime_type),
                );
                return await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => reject(new Error('Could not read image export'));
                    reader.readAsDataURL(blob);
                });
            } finally {
                if (exportUrl) URL.revokeObjectURL(exportUrl);
            }
        },
        [asset, croppedByUser],
    );

    const reloadWithAsset = useCallback(
        async (newAsset: MediaAsset) => {
            // Reset state
            setHasChanged(false);
            setCroppedByUser(false);
            setCamanFilters({});
            filtersRef.current = {};
            previewQueueRef.current?.cancel();
            setShowDiff(false);

            // Reset cropper transforms
            const cropperImage = cropperImageRef.current;
            const cropperSelection = cropperSelectionRef.current;
            const cropperHandle = cropperHandleRef.current;

            if (cropperImage) {
                cropperImage.$resetTransform();
            }

            if (cropperSelection) {
                cropperSelection.$reset();
                cropperSelection.hidden = true;
            }

            if (cropperHandle) {
                cropperHandle.action = ACTION_MOVE;
            }

            setDragMode('move');

            // Reload the filter processor with the new image
            if (filterProcessorRef.current) {
                // Add cache buster to force reload
                const cacheBustedUrl = `${newAsset.url}?t=${Date.now()}`;
                await filterProcessorRef.current.loadImage(cacheBustedUrl);
                setOriginalImageUrl(cacheBustedUrl);
            }

            // Update cropper image source with cache buster
            if (cropperImage) {
                const cacheBustedUrl = `${newAsset.url}?t=${Date.now()}`;
                cropperImage.$image.src = cacheBustedUrl;
                setTimeout(() => centerImage(), 100);
            }
        },
        [centerImage],
    );

    const handleSave = useCallback(async () => {
        if (!asset || !cropperSelectionRef.current) return;

        setProcessing(true);
        setSaving(true);
        setEditorError('');

        try {
            const imageData = await getCropperData(true);
            if (!imageData) throw new Error('No image to save');
            const response = await axios.post(route('media.image-editor.save'), {
                data: imageData,
                path: asset.directory || '',
                name: asset.filename,
                mime_type: asset.mime_type,
                overwrite: true,
                asset_id: asset.id,
            });

            if (!response.data.success) throw new Error('The server could not save the image');
            if (response.data.success) {
                // Reload the editor with the saved image instead of closing
                await reloadWithAsset(response.data.asset);
                onSaved?.(response.data.asset);
            }
        } catch (error) {
            console.error('Error saving image:', error);
            setEditorError('Your image could not be saved. Your edits are still here; please try again.');
        } finally {
            setSaving(false);
            setProcessing(false);
        }
    }, [asset, getCropperData, onSaved, reloadWithAsset]);

    const handleSaveAsCopy = useCallback(async () => {
        if (!asset || !cropperSelectionRef.current) return;

        setProcessing(true);
        setSaving(true);
        setEditorError('');

        try {
            const imageData = await getCropperData(true);
            if (!imageData) throw new Error('No image to save');
            // Generate a new filename for the copy
            const timestamp = Date.now();
            const nameWithoutExt = asset.filename.replace(/\.[^/.]+$/, '');
            const extension = asset.filename.split('.').pop();
            const newFilename = `${nameWithoutExt}_copy_${timestamp}.${extension}`;

            const response = await axios.post(route('media.image-editor.save'), {
                data: imageData,
                path: asset.directory || '',
                name: newFilename,
                mime_type: asset.mime_type,
                overwrite: false,
            });

            if (!response.data.success) throw new Error('The server could not save the image');
            if (response.data.success) {
                onSaved?.(response.data.asset);
                // Reset the editor state but keep the original image
                // (the copy was saved separately, original is unchanged)
                setHasChanged(false);
            }
        } catch (error) {
            console.error('Error saving image copy:', error);
            setEditorError('The copy could not be saved. Your edits are still here; please try again.');
        } finally {
            setSaving(false);
            setProcessing(false);
        }
    }, [asset, getCropperData, onSaved]);

    const toggleDiff = useCallback(async () => {
        if (showDiff) {
            setShowDiff(false);
            return;
        }
        try {
            setProcessing(true);
            const image = await getCropperData();
            if (image) {
                setEditedImageUrl(image);
                setShowDiff(true);
            }
        } catch {
            setEditorError('Could not prepare the comparison. Please try again.');
        } finally {
            setProcessing(false);
        }
    }, [showDiff, getCropperData]);

    const resetFilters = useCallback(() => {
        filtersRef.current = {};
        setCamanFilters({});
        setEditorError('');
        setPreviewFailed(false);
        previewQueueRef.current?.schedule({});
    }, []);

    const applyFilter = useCallback((name: string, value: number | boolean | null) => {
        if (!previewQueueRef.current) return;

        setHasChanged(true);

        const filters: Record<string, number | boolean | undefined> = { ...filtersRef.current };

        if (value === false || value === null || value === undefined) {
            delete filters[name];
        } else {
            filters[name] = value;
        }

        setCamanFilters(filters);
        filtersRef.current = filters;
        setEditorError('');
        setPreviewFailed(false);
        previewQueueRef.current.schedule(filters);
    }, []);

    const haveFilters = () => Object.keys(camanFilters).length > 0;

    useEffect(() => {
        if (!isOpen || imageLoading || !cropperCanvasRef.current) return;

        const canvas = cropperCanvasRef.current;

        const handleActionStart = (e: Event) => {
            const customEvent = e as CustomEvent;
            const action = customEvent.detail?.action;
            if (action === 'select' || action?.includes('resize')) {
                setCroppedByUser(true);
                const cropperSelection = cropperSelectionRef.current;
                if (cropperSelection) {
                    cropperSelection.hidden = false;
                }
            }
        };

        const handleActionMove = (e: Event) => {
            const customEvent = e as CustomEvent;
            const action = customEvent.detail?.action;
            if (action === 'select' || action?.includes('resize')) {
                setCroppedByUser(true);
                setHasChanged(true);
            }
        };

        const handleActionEnd = () => {
            checkForChanges();
        };

        canvas.addEventListener('actionstart', handleActionStart);
        canvas.addEventListener('actionmove', handleActionMove);
        canvas.addEventListener('actionend', handleActionEnd);

        return () => {
            canvas.removeEventListener('actionstart', handleActionStart);
            canvas.removeEventListener('actionmove', handleActionMove);
            canvas.removeEventListener('actionend', handleActionEnd);
        };
    }, [isOpen, imageLoading, checkForChanges]);

    if (!asset) return null;

    const busy = processing || imageLoading;
    const requestClose = () => {
        if (processing) return;
        if (hasChanged) setDiscardOpen(true);
        else onClose();
    };

    return (
        <>
            <Dialog
                open={isOpen}
                onOpenChange={(open) => {
                    if (!open) requestClose();
                }}
            >
                <DialogContent
                    ref={dialogRef}
                    tabIndex={-1}
                    aria-describedby="image-editor-description"
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        dialogRef.current?.focus();
                    }}
                    onInteractOutside={(event) => event.preventDefault()}
                    className="image-editor-dialog flex flex-col gap-0 overflow-hidden p-0 outline-none"
                >
                    <DialogHeader className="image-editor-header border-border/60 shrink-0 border-b px-5 py-4 pr-12 text-left">
                        <DialogTitle className="text-base">Edit image</DialogTitle>
                        <p id="image-editor-description" className="text-muted-foreground truncate text-xs" title={asset.filename}>
                            {asset.filename}
                        </p>
                    </DialogHeader>

                    <div className="image-editor-toolbar border-border/60 flex shrink-0 items-center justify-between gap-4 overflow-x-auto border-b px-3 py-2">
                        <ImageControls
                            dragMode={dragMode}
                            onOperation={handleOperation}
                            processing={busy || previewPending || showDiff || imageFailed}
                        />
                        <Button
                            type="button"
                            variant={showDiff ? 'secondary' : 'outline'}
                            size="sm"
                            disabled={busy || previewPending || previewFailed || (!hasChanged && !showDiff) || imageFailed}
                            aria-pressed={showDiff}
                            onClick={toggleDiff}
                        >
                            <Columns2 className="size-4" />
                            {showDiff ? 'Back to editing' : 'Compare'}
                        </Button>
                    </div>
                    {editorError && (
                        <div
                            role="alert"
                            className="text-destructive border-border/60 flex shrink-0 items-center justify-between gap-3 border-b px-5 py-3 text-sm"
                        >
                            <span>{editorError}</span>
                            {imageFailed && (
                                <Button type="button" variant="outline" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
                                    Retry
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="image-editor-workspace">
                        <div className="image-editor-stage flex min-h-0 min-w-0 flex-col">
                            <div
                                ref={containerRef}
                                className="__cropper relative min-h-0 flex-1 overflow-hidden"
                                aria-label="Image editing canvas"
                                aria-busy={busy || previewPending}
                            >
                                {previewPending && !busy && (
                                    <div
                                        role="status"
                                        aria-live="polite"
                                        className="bg-background/95 text-foreground pointer-events-none absolute right-3 bottom-3 z-20 flex items-center gap-2 rounded-md border px-3 py-2 text-xs shadow-sm"
                                    >
                                        <Loader2 aria-hidden="true" className="size-3.5 motion-safe:animate-spin" />
                                        Updating preview…
                                    </div>
                                )}
                                {(busy || imageFailed) && (
                                    <div className="bg-background/85 absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-6 text-center">
                                        {imageFailed ? (
                                            <ImageOff className="text-muted-foreground size-6" />
                                        ) : (
                                            <Loader2 aria-hidden="true" className="text-muted-foreground size-5 motion-safe:animate-spin" />
                                        )}
                                        <p role="status" className="text-muted-foreground text-sm">
                                            {imageFailed
                                                ? 'Image could not be loaded'
                                                : imageLoading
                                                  ? 'Preparing your image…'
                                                  : saving
                                                    ? 'Saving your image…'
                                                    : 'Applying changes…'}
                                        </p>
                                    </div>
                                )}
                                {showDiff && originalImageUrl && (
                                    <div className="bg-muted absolute inset-0 z-10 grid grid-cols-2 gap-px">
                                        <figure className="bg-background relative min-h-0 min-w-0">
                                            <AssetImagePreview src={originalImageUrl} alt="Original image" fit="contain" eager />
                                            <figcaption className="bg-background/90 absolute bottom-3 left-3 rounded px-2 py-1 text-xs">
                                                Original
                                            </figcaption>
                                        </figure>
                                        <figure className="bg-background relative min-h-0 min-w-0">
                                            <AssetImagePreview src={editedImageUrl} alt="Image with your edits" fit="contain" eager />
                                            <figcaption className="bg-background/90 absolute right-3 bottom-3 rounded px-2 py-1 text-xs">
                                                Edited
                                            </figcaption>
                                        </figure>
                                    </div>
                                )}
                                {React.createElement(
                                    'cropper-canvas',
                                    {
                                        ref: cropperCanvasRef,
                                        disabled: processing || imageLoading || previewPending ? 'true' : undefined,
                                        style: {
                                            height: '100%',
                                            width: '100%',
                                        },
                                    },
                                    [
                                        React.createElement('cropper-image', {
                                            key: `image-${asset.id}-${loadAttempt}`,
                                            ref: cropperImageRef,
                                            src: asset.url,
                                            alt: asset.filename,
                                            rotatable: 'true',
                                            scalable: 'true',
                                            translatable: 'true',
                                        }),
                                        React.createElement('cropper-shade', { key: 'shade', 'theme-color': 'rgba(0, 0, 0, 0.45)' }),
                                        React.createElement('cropper-handle', {
                                            key: 'handle',
                                            ref: cropperHandleRef,
                                            action: dragMode === 'move' ? ACTION_MOVE : ACTION_SELECT,
                                            plain: true,
                                        }),
                                        React.createElement(
                                            'cropper-selection',
                                            {
                                                key: 'selection',
                                                ref: cropperSelectionRef,
                                                'initial-coverage': 0,
                                                movable: true,
                                                resizable: true,
                                                hidden: true,
                                            },
                                            [
                                                React.createElement('cropper-grid', {
                                                    key: 'grid',
                                                    role: 'grid',
                                                    covered: true,
                                                }),
                                                React.createElement('cropper-crosshair', {
                                                    key: 'crosshair',
                                                    centered: true,
                                                }),
                                                React.createElement('cropper-handle', {
                                                    key: 'move-handle',
                                                    action: ACTION_MOVE,
                                                    'theme-color': 'rgba(255, 255, 255, 0.35)',
                                                }),
                                                React.createElement('cropper-handle', { key: 'n-resize', action: ACTION_RESIZE_NORTH }),
                                                React.createElement('cropper-handle', { key: 'e-resize', action: ACTION_RESIZE_EAST }),
                                                React.createElement('cropper-handle', { key: 's-resize', action: ACTION_RESIZE_SOUTH }),
                                                React.createElement('cropper-handle', { key: 'w-resize', action: ACTION_RESIZE_WEST }),
                                                React.createElement('cropper-handle', { key: 'ne-resize', action: ACTION_RESIZE_NORTHEAST }),
                                                React.createElement('cropper-handle', { key: 'nw-resize', action: ACTION_RESIZE_NORTHWEST }),
                                                React.createElement('cropper-handle', { key: 'se-resize', action: ACTION_RESIZE_SOUTHEAST }),
                                                React.createElement('cropper-handle', { key: 'sw-resize', action: ACTION_RESIZE_SOUTHWEST }),
                                            ],
                                        ),
                                    ],
                                )}
                            </div>
                            <div className="text-muted-foreground border-border/60 flex shrink-0 items-center justify-between gap-3 border-t px-4 py-2 text-xs">
                                <span>
                                    {showDiff
                                        ? 'Original and edited image'
                                        : dragMode === 'crop'
                                          ? 'Drag on the image to select a crop.'
                                          : 'Drag to reposition. Use the tools above to crop or rotate.'}
                                </span>
                                <span className="hidden shrink-0 uppercase sm:inline">{asset.extension}</span>
                            </div>
                        </div>
                        <aside aria-label="Image adjustments" className="image-editor-inspector bg-background min-h-0 min-w-0 overflow-y-auto">
                            <Tabs defaultValue="adjust" className="gap-0">
                                <div className="bg-background sticky top-0 z-10 px-4 pt-4 pb-3">
                                    <TabsList className="grid w-full grid-cols-2" aria-label="Editing panel">
                                        <TabsTrigger value="adjust">
                                            <SlidersHorizontal className="size-4" />
                                            Adjust
                                        </TabsTrigger>
                                        <TabsTrigger value="presets">
                                            <Sparkles className="size-4" />
                                            Presets
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent value="adjust" className="m-0 px-5 pb-5">
                                    <div className="mb-4 flex items-center justify-between gap-2">
                                        <h2 className="text-sm font-medium">Light & color</h2>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            disabled={busy || showDiff || !haveFilters()}
                                            onClick={resetFilters}
                                        >
                                            Reset filters
                                        </Button>
                                    </div>
                                    <ImageFilters
                                        processing={busy || showDiff || imageFailed}
                                        applyFilter={applyFilter}
                                        camanFilters={camanFilters}
                                    />
                                </TabsContent>
                                <TabsContent value="presets" className="m-0 px-4 pb-5">
                                    <FilterPresets
                                        processing={busy || showDiff || imageFailed}
                                        camanFilters={camanFilters}
                                        applyFilter={applyFilter}
                                    />
                                </TabsContent>
                            </Tabs>
                        </aside>
                    </div>

                    <footer className="image-editor-footer border-border/60 bg-background flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-5 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" variant="ghost" disabled={busy || !hasChanged} onClick={() => handleOperation('reset')}>
                                <RotateCcw className="size-4" />
                                Reset all
                            </Button>
                            {croppedByUser && (
                                <Button type="button" variant="ghost" disabled={busy} onClick={() => handleOperation('clear')}>
                                    Clear crop
                                </Button>
                            )}
                            <span role="status" className="text-muted-foreground hidden text-xs lg:inline">
                                {saving
                                    ? 'Saving…'
                                    : previewPending
                                      ? 'Applying your latest settings…'
                                      : hasChanged
                                        ? 'Unsaved changes'
                                        : 'No unsaved changes'}
                            </span>
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <Button type="button" variant="outline" disabled={processing} onClick={requestClose}>
                                Cancel
                            </Button>
                            <SaveDropdown
                                onSave={handleSave}
                                onSaveAsCopy={handleSaveAsCopy}
                                isSaving={saving}
                                disabled={busy || previewPending || previewFailed || imageFailed}
                                hasChanges={hasChanged}
                            />
                        </div>
                    </footer>
                </DialogContent>
            </Dialog>
            <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard your edits?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your unsaved image changes will be lost. The original file has not been changed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep editing</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                setDiscardOpen(false);
                                onClose();
                            }}
                        >
                            Discard edits
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
