import { MediaAsset } from '@media/types/media';
import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { TooltipButton } from '@shared/components/ui/tooltip-button';
import axios from 'axios';
import { Code, Loader2, RotateCcw, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FilterPresets } from './FilterPresets';
import { ImageControls } from './ImageControls';
import { ImageFilters } from './ImageFilters';
import { SaveDropdown } from './SaveDropdown';

import '@media/../css/image-editor.css';
import { FilterOptions, ImageFilterProcessor } from '@media/utils/imageFilters';
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
const isIdentityMatrix = (matrix: number[]): boolean => {
    return matrix[0] === 1 && matrix[1] === 0 && matrix[2] === 0 && matrix[3] === 1 && matrix[4] === 0 && matrix[5] === 0;
};

const flipImage = (cropperImage: CropperImage, direction: 'horizontal' | 'vertical'): void => {
    const matrix = cropperImage.$getTransform();
    if (direction === 'horizontal') {
        cropperImage.$scale(-matrix[0], matrix[3]);
    } else {
        cropperImage.$scale(matrix[0], -matrix[3]);
    }
};

interface ImageEditorProps {
    asset: MediaAsset | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved?: (asset: MediaAsset) => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ asset, isOpen, onClose, onSaved }) => {
    const [processing, setProcessing] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [hasChanged, setHasChanged] = useState(false);
    const [dragMode, setDragMode] = useState<'move' | 'crop'>('move');
    const [croppedByUser, setCroppedByUser] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const [diffDisable, setDiffDisable] = useState(true);
    const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
    const [editedImageUrl, setEditedImageUrl] = useState<string>('');
    const [camanFilters, setCamanFilters] = useState<FilterOptions>({});

    const cropperCanvasRef = useRef<CropperCanvasElement>(null);
    const cropperImageRef = useRef<CropperImageElement>(null);
    const cropperSelectionRef = useRef<CropperSelectionElement>(null);
    const cropperHandleRef = useRef<CropperHandleElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const filterProcessorRef = useRef<ImageFilterProcessor | null>(null);

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
        setDiffDisable(true);
        setOriginalImageUrl('');
        setEditedImageUrl('');
        setCamanFilters({});

        if (filterProcessorRef.current) {
            filterProcessorRef.current = null;
        }

        const cropperImage = cropperImageRef.current;
        const cropperSelection = cropperSelectionRef.current;
        const cropperHandle = cropperHandleRef.current;

        if (cropperImage) {
            try {
                cropperImage.$resetTransform();
                cropperImage.$image.src = '';
            } catch (error) {}
        }

        if (cropperSelection) {
            try {
                cropperSelection.$reset();
                cropperSelection.hidden = true;
            } catch (error) {}
        }

        if (cropperHandle) {
            try {
                cropperHandle.action = ACTION_MOVE;
            } catch (error) {}
        }
    }, []);

    const initializeCropper = useCallback(async () => {
        if (!asset) return;

        setImageLoading(true);
        setOriginalImageUrl(asset.url);

        filterProcessorRef.current = new ImageFilterProcessor();
        await filterProcessorRef.current.loadImage(asset.url);

        setTimeout(() => {
            setProcessing(false);
            setTimeout(() => {
                centerImage();
                setImageLoading(false);
            }, 100);
        }, 200);
    }, [asset, centerImage]);

    useEffect(() => {
        if (isOpen && asset) {
            setProcessing(true);
            initializeCropper();
        } else if (!isOpen) {
            cleanup();
        }
    }, [isOpen, asset, initializeCropper, cleanup]);

    useEffect(() => {
        if (!isOpen || !asset || !cropperImageRef.current) return;

        const cropperImage = cropperImageRef.current;

        // Simple ready check - wait for the image element to be ready
        const initImage = () => {
            setTimeout(() => {
                if (cropperImage.$ready) {
                    cropperImage.$ready().then(() => {
                        centerImage();
                        setImageLoading(false);
                    });
                } else {
                    centerImage();
                    setImageLoading(false);
                }
            }, 100);
        };

        initImage();

        // Add resize observer to re-center image when container size changes
        const container = containerRef.current;
        if (container) {
            const resizeObserver = new ResizeObserver(() => {
                if (!processing && !imageLoading) {
                    centerImage();
                }
            });
            resizeObserver.observe(container);

            return () => {
                resizeObserver.disconnect();
            };
        }
    }, [isOpen, asset, centerImage, processing, imageLoading]);

    const handleOperation = useCallback((action: string) => {
        const cropperImage = cropperImageRef.current;
        const cropperSelection = cropperSelectionRef.current;
        const cropperHandle = cropperHandleRef.current;

        if (!cropperImage) return;

        switch (action) {
            case 'move':
                setDragMode('move');
                if (cropperHandle) cropperHandle.action = ACTION_MOVE;
                break;

            case 'crop':
                setDragMode('crop');
                if (cropperHandle) cropperHandle.action = ACTION_SELECT;
                break;

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
                break;

            case 'clear':
                setCroppedByUser(false);
                if (cropperSelection) {
                    cropperSelection.hidden = true;
                    cropperSelection.$reset();
                }
                setHasChanged(false);
                break;
        }

        checkForChanges();
    }, []);

    const checkForChanges = useCallback(() => {
        const cropperImage = cropperImageRef.current;
        const cropperSelection = cropperSelectionRef.current;
        if (!cropperImage) return;

        const matrix = cropperImage.$getTransform();
        const hasFilters = Object.keys(camanFilters).length > 0;
        const hasCrop = cropperSelection ? cropperSelection.width > 0 && cropperSelection.height > 0 && !cropperSelection.hidden : false;
        const hasTransform = !isIdentityMatrix(matrix);

        setHasChanged(hasTransform || hasCrop || hasFilters);
    }, [camanFilters]);

    const resetAll = useCallback(() => {
        const cropperImage = cropperImageRef.current;
        const cropperSelection = cropperSelectionRef.current;
        const cropperHandle = cropperHandleRef.current;
        if (!cropperImage) return;

        setDragMode('move');
        setHasChanged(false);
        setCroppedByUser(false);
        setCamanFilters({});

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
            const originalImageUrl = filterProcessorRef.current.reset();
            cropperImage.$image.src = originalImageUrl;
        }
    }, [centerImage]);

    const getCropperData = useCallback(async () => {
        const cropperSelection = cropperSelectionRef.current;
        const cropperImage = cropperImageRef.current;
        if (!cropperSelection || !asset || !cropperImage) return null;

        if (!croppedByUser || cropperSelection.hidden) {
            cropperSelection.hidden = false;
            cropperSelection.x = 0;
            cropperSelection.y = 0;
            cropperSelection.width = cropperImage.$image.naturalWidth || 800;
            cropperSelection.height = cropperImage.$image.naturalHeight || 600;
        }

        const canvas = await cropperSelection.$toCanvas({
            beforeDraw: (context, canvas) => {
                if (asset.mime_type?.includes('png')) {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                } else {
                    context.fillStyle = '#fff';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                }
            },
        });

        if (!croppedByUser) {
            cropperSelection.hidden = true;
        }

        return canvas.toDataURL(asset.mime_type);
    }, [asset, croppedByUser]);

    const handleSave = useCallback(async () => {
        if (!asset || !cropperSelectionRef.current) return;

        const imageData = await getCropperData();
        if (!imageData) return;

        setProcessing(true);

        const response = await axios.post(route('media.image-editor.save'), {
            data: imageData,
            path: '',
            name: asset.filename,
            mime_type: asset.mime_type,
            overwrite: true,
        });

        if (response.data.success) {
            onSaved?.(response.data.asset);
            onClose();
        }

        setProcessing(false);
    }, [asset, getCropperData, onSaved, onClose]);

    const handleSaveAsCopy = useCallback(async () => {
        if (!asset || !cropperSelectionRef.current) return;

        const imageData = await getCropperData();
        if (!imageData) return;

        setProcessing(true);

        // Generate a new filename for the copy
        const timestamp = Date.now();
        const nameWithoutExt = asset.filename.replace(/\.[^/.]+$/, '');
        const extension = asset.filename.split('.').pop();
        const newFilename = `${nameWithoutExt}_copy_${timestamp}.${extension}`;

        const response = await axios.post(route('media.image-editor.save'), {
            data: imageData,
            path: '',
            name: newFilename,
            mime_type: asset.mime_type,
            overwrite: false,
        });

        if (response.data.success) {
            onSaved?.(response.data.asset);
            onClose();
        }

        setProcessing(false);
    }, [asset, getCropperData, onSaved, onClose]);

    const toggleDiff = useCallback(async () => {
        if (!showDiff && filterProcessorRef.current) {
            const currentEditedUrl = filterProcessorRef.current.getDataURL();
            setEditedImageUrl(currentEditedUrl);
        }
        setShowDiff(!showDiff);
    }, [showDiff]);

    useEffect(() => {
        const hasFilters = Object.keys(camanFilters).length > 0;
        const cropperImage = cropperImageRef.current;
        const hasTransforms = cropperImage ? !isIdentityMatrix(cropperImage.$getTransform()) : false;

        setDiffDisable(!hasFilters && !hasTransforms);
    }, [camanFilters, hasChanged]);

    const resetFilters = useCallback(() => {
        if (!filterProcessorRef.current) return;

        setCamanFilters({});

        const originalImageUrl = filterProcessorRef.current.reset();
        if (cropperImageRef.current) {
            cropperImageRef.current.$image.src = originalImageUrl;
        }
    }, []);

    const applyFilter = useCallback(
        async (name: string, value: any) => {
            if (!filterProcessorRef.current) return;

            setHasChanged(true);
            setProcessing(true);

            const filters = { ...camanFilters };

            if (value === false || value === null || value === undefined) {
                delete (filters as any)[name];
            } else {
                (filters as any)[name] = value;
            }

            setCamanFilters(filters);

            const filteredImageUrl = filterProcessorRef.current.applyFilters(filters);
            if (cropperImageRef.current) {
                cropperImageRef.current.$image.src = filteredImageUrl;
            }

            setProcessing(false);
        },
        [camanFilters],
    );

    const haveFilters = () => Object.keys(camanFilters).length > 0;

    useEffect(() => {
        if (!isOpen || !cropperCanvasRef.current) return;

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
            if (action === 'select' || action === 'move' || action?.includes('resize')) {
                setCroppedByUser(true);
                setHasChanged(true);
            }
        };

        const handleActionEnd = () => {
            checkForChanges();
        };

        canvas.addEventListener('actionstart' as any, handleActionStart);
        canvas.addEventListener('actionmove' as any, handleActionMove);
        canvas.addEventListener('actionend' as any, handleActionEnd);

        return () => {
            canvas.removeEventListener('actionstart' as any, handleActionStart);
            canvas.removeEventListener('actionmove' as any, handleActionMove);
            canvas.removeEventListener('actionend' as any, handleActionEnd);
        };
    }, [isOpen, checkForChanges]);

    if (!asset) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="h-[95vh] !w-[95vw] !max-w-[95vw] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle>Image Editor - {asset.filename}</DialogTitle>
                </DialogHeader>

                <div className="image-editor flex min-h-0 flex-col">
                    <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-2 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center space-x-2">
                            <ImageFilters
                                processing={processing || imageLoading}
                                reset={false}
                                applyFilter={applyFilter}
                                camanFilters={camanFilters}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <TooltipButton
                                variant="outline"
                                size="sm"
                                disabled={processing || imageLoading || diffDisable}
                                className={showDiff ? 'bg-blue-100 dark:bg-blue-900' : ''}
                                onClick={toggleDiff}
                                tooltip={showDiff ? 'Hide comparison' : 'Show before/after comparison'}
                            >
                                <Code className="h-4 w-4" />
                            </TooltipButton>

                            <TooltipButton
                                variant="outline"
                                size="sm"
                                disabled={processing || imageLoading || !haveFilters()}
                                onClick={resetFilters}
                                tooltip="Clear all filters"
                            >
                                <X className="h-4 w-4" />
                            </TooltipButton>
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-1 overflow-hidden">
                        <div className="flex w-16 flex-col items-center space-y-2 border-r bg-gray-50 py-2 dark:border-gray-700 dark:bg-gray-800">
                            <ImageControls dragMode={dragMode} onOperation={handleOperation} processing={processing || imageLoading} />
                        </div>

                        <div
                            ref={containerRef}
                            className="__cropper relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-900"
                        >
                            {(processing || imageLoading) && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
                                    <div className="flex flex-col items-center space-y-4 rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
                                        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                                        <div className="text-center">
                                            <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                                {imageLoading ? 'Loading Image' : 'Processing'}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                                {imageLoading ? 'Please wait while the image loads...' : 'Applying changes...'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showDiff && originalImageUrl && (
                                <div className="__diff-overlay bg-opacity-95 absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
                                    <div className="__diff-container relative flex h-full max-h-[90%] w-full max-w-[90%] overflow-hidden rounded-lg bg-white shadow-2xl">
                                        <div className="relative flex w-1/2 items-center justify-center border-r border-gray-300 bg-gray-100">
                                            <img
                                                src={originalImageUrl}
                                                alt="Original"
                                                className="__diff-image max-h-full max-w-full object-contain"
                                                style={{ maxWidth: '100%', maxHeight: '100%' }}
                                            />
                                            <div className="bg-opacity-80 absolute bottom-4 left-4 rounded bg-black px-3 py-1 text-sm font-medium text-white">
                                                Original
                                            </div>
                                        </div>

                                        <div className="relative flex w-1/2 items-center justify-center bg-gray-100">
                                            {editedImageUrl ? (
                                                <img
                                                    src={editedImageUrl}
                                                    alt="Edited"
                                                    className="__diff-image max-h-full max-w-full object-contain"
                                                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                                                />
                                            ) : (
                                                <div className="text-sm text-gray-500">Loading edited image...</div>
                                            )}
                                            <div className="bg-opacity-80 absolute right-4 bottom-4 rounded bg-black px-3 py-1 text-sm font-medium text-white">
                                                Edited
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setShowDiff(false)}
                                            className="bg-opacity-80 hover:bg-opacity-100 absolute top-4 right-4 rounded-full bg-black p-2 text-white transition-all duration-200"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>

                                        <div className="absolute top-0 left-1/2 h-full w-px -translate-x-px transform bg-gray-300"></div>
                                    </div>
                                </div>
                            )}

                            {React.createElement(
                                'cropper-canvas',
                                {
                                    ref: cropperCanvasRef,
                                    background: 'true',
                                    disabled: processing || imageLoading ? 'true' : undefined,
                                    style: {
                                        height: '100%',
                                        width: '100%',
                                    },
                                },
                                [
                                    React.createElement('cropper-image', {
                                        key: `image-${asset.id}`,
                                        ref: cropperImageRef,
                                        src: asset.url,
                                        alt: asset.filename,
                                        rotatable: 'true',
                                        scalable: 'true',
                                        translatable: 'true',
                                    }),
                                    React.createElement('cropper-shade', { key: 'shade' }),
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

                        <div className="w-64 border-l bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                            <FilterPresets processing={processing || imageLoading} camanFilters={camanFilters} applyFilter={applyFilter} />
                        </div>
                    </div>

                    <div className="flex items-center justify-center space-x-2 border-t bg-gray-50 px-6 py-2 dark:border-gray-700 dark:bg-gray-800">
                        <Button variant="outline" disabled={processing || imageLoading || !hasChanged} onClick={() => handleOperation('reset')}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>

                        <Button variant="outline" disabled={processing || imageLoading || !croppedByUser} onClick={() => handleOperation('clear')}>
                            Clear
                        </Button>

                        <SaveDropdown onSave={handleSave} onSaveAsCopy={handleSaveAsCopy} isSaving={processing} hasChanges={hasChanged} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
