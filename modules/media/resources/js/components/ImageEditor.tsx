import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { TooltipButton } from '@shared/components/ui/tooltip-button';
import axios from 'axios';
import { Code, RotateCcw, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MediaAsset } from '../types/media';
import { FilterPresets } from './FilterPresets';
import { ImageControls } from './ImageControls';
import { ImageFilters } from './ImageFilters';

// Import the required libraries
import 'cropperjs';
import '../../css/image-editor.css';
import { FilterOptions, ImageFilterProcessor } from '../utils/imageFilters';

// Import official Cropper.js v2 types and constants
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

// Type aliases for easier usage
type CropperImageElement = CropperImage;
type CropperSelectionElement = CropperSelection;
type CropperCanvasElement = CropperCanvas;
type CropperHandleElement = CropperHandle;

// Utility functions
const isIdentityMatrix = (matrix: number[]): boolean => {
    // Identity matrix: [scaleX=1, skewY=0, skewX=0, scaleY=1, translateX=0, translateY=0]
    return matrix[0] === 1 && matrix[1] === 0 && matrix[2] === 0 && matrix[3] === 1 && matrix[4] === 0 && matrix[5] === 0;
};

const flipImage = (cropperImage: CropperImage, direction: 'horizontal' | 'vertical'): void => {
    const matrix = cropperImage.$getTransform();
    // Matrix format: [scaleX, skewY, skewX, scaleY, translateX, translateY]
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

        // Use v2's built-in center method with contain mode
        cropperImage.$center('contain');
    }, []);

    const initializeCropper = useCallback(async () => {
        if (!asset) return;

        // Store original image URL for diff comparison
        setOriginalImageUrl(asset.url);

        // Initialize filter processor
        filterProcessorRef.current = new ImageFilterProcessor();
        await filterProcessorRef.current.loadImage(asset.url);

        // Give web components time to initialize before stopping processing
        setTimeout(() => setProcessing(false), 200);
    }, [asset]);

    // Initialize when dialog opens
    useEffect(() => {
        if (isOpen && asset) {
            setProcessing(true);
            initializeCropper();
        }
    }, [isOpen, asset, initializeCropper]);

    // Handle image centering using $ready promise from official API
    useEffect(() => {
        if (!isOpen || !asset || !cropperImageRef.current) return;

        const cropperImage = cropperImageRef.current;

        // Use the official $ready method which returns a promise
        cropperImage.$ready().then(() => {
            centerImage();
        });
    }, [isOpen, asset, centerImage]);

    // Handle container resize to re-center image
    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            // Re-center image when container size changes
            setTimeout(() => centerImage(), 100);
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [isOpen, centerImage]);

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

        // Reset state
        setDragMode('move');
        setHasChanged(false);
        setCroppedByUser(false);
        setCamanFilters({});

        // Reset image transform
        cropperImage.$resetTransform();
        setTimeout(() => centerImage(), 100);

        // Reset selection
        if (cropperSelection) {
            cropperSelection.$reset();
            cropperSelection.hidden = true;
        }

        // Reset handle
        if (cropperHandle) {
            cropperHandle.action = ACTION_MOVE;
        }

        // Reset filters
        if (filterProcessorRef.current) {
            const originalImageUrl = filterProcessorRef.current.reset();
            cropperImage.$image.src = originalImageUrl;
        }
    }, [centerImage]);

    const getCropperData = useCallback(async () => {
        const cropperSelection = cropperSelectionRef.current;
        const cropperImage = cropperImageRef.current;
        if (!cropperSelection || !asset || !cropperImage) return null;

        // Create full image selection if user hasn't cropped
        if (!croppedByUser || cropperSelection.hidden) {
            cropperSelection.hidden = false;
            cropperSelection.x = 0;
            cropperSelection.y = 0;
            cropperSelection.width = cropperImage.$image.naturalWidth || 800;
            cropperSelection.height = cropperImage.$image.naturalHeight || 600;
        }

        const canvas = await cropperSelection.$toCanvas({
            beforeDraw: (context, canvas) => {
                // Set fill color for transparency support
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
        });

        if (response.data.success) {
            onSaved?.(response.data.asset);
            onClose();
        }

        setProcessing(false);
    }, [asset, getCropperData, onSaved, onClose]);

    const toggleDiff = useCallback(async () => {
        if (!showDiff && filterProcessorRef.current) {
            // Get current edited image URL (with filters applied)
            const currentEditedUrl = filterProcessorRef.current.getDataURL();
            setEditedImageUrl(currentEditedUrl);
        }
        setShowDiff(!showDiff);
    }, [showDiff]);

    // Enable diff when there are changes to show
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

            let filters = { ...camanFilters };

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

    // Event listeners
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
                <DialogHeader className="border-b px-6 py-3">
                    <DialogTitle>Image Editor - {asset.filename}</DialogTitle>
                </DialogHeader>

                <div className="image-editor flex min-h-0 flex-col">
                    {/* Top Toolbar */}
                    <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-2 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-center space-x-2">
                            <ImageFilters processing={processing} reset={false} applyFilter={applyFilter} camanFilters={camanFilters} />
                        </div>

                        <div className="flex items-center space-x-2">
                            <TooltipButton
                                variant="outline"
                                size="sm"
                                disabled={processing || diffDisable}
                                className={showDiff ? 'bg-blue-100 dark:bg-blue-900' : ''}
                                onClick={toggleDiff}
                                tooltip={showDiff ? 'Hide comparison' : 'Show before/after comparison'}
                            >
                                <Code className="h-4 w-4" />
                            </TooltipButton>

                            <TooltipButton
                                variant="outline"
                                size="sm"
                                disabled={processing || !haveFilters()}
                                onClick={resetFilters}
                                tooltip="Clear all filters"
                            >
                                <X className="h-4 w-4" />
                            </TooltipButton>
                        </div>
                    </div>

                    {/* Main Editor Area */}
                    <div className="flex min-h-0 flex-1 overflow-hidden">
                        {/* Side Controls */}
                        <div className="flex w-16 flex-col items-center space-y-2 border-r bg-gray-50 py-2 dark:border-gray-700 dark:bg-gray-800">
                            <ImageControls dragMode={dragMode} onOperation={handleOperation} processing={processing} />
                        </div>

                        {/* Image Area */}
                        <div ref={containerRef} className="__cropper relative min-h-0 flex-1 bg-gray-100 dark:bg-gray-900">
                            {processing && (
                                <div className="__loader">
                                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                                </div>
                            )}

                            {/* Diff Comparison Overlay */}
                            {showDiff && originalImageUrl && (
                                <div className="__diff-overlay bg-opacity-95 absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
                                    <div className="__diff-container relative flex h-full max-h-[90%] w-full max-w-[90%] overflow-hidden rounded-lg bg-white shadow-2xl">
                                        {/* Original Image - Left Half */}
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

                                        {/* Current/Edited Image - Right Half */}
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

                                        {/* Close diff button */}
                                        <button
                                            onClick={() => setShowDiff(false)}
                                            className="bg-opacity-80 hover:bg-opacity-100 absolute top-4 right-4 rounded-full bg-black p-2 text-white transition-all duration-200"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>

                                        {/* Divider line */}
                                        <div className="absolute top-0 left-1/2 h-full w-px -translate-x-px transform bg-gray-300"></div>
                                    </div>
                                </div>
                            )}

                            {React.createElement(
                                'cropper-canvas',
                                {
                                    ref: cropperCanvasRef,
                                    background: true,
                                    disabled: processing,
                                    'scale-step': 0.1,
                                    style: { opacity: processing ? 0 : 1, width: '100%', height: '100%' },
                                },
                                [
                                    React.createElement('cropper-image', {
                                        key: 'image',
                                        ref: cropperImageRef,
                                        src: asset.url,
                                        alt: `Image to edit: ${asset.filename}`,
                                        translatable: true,
                                        rotatable: true,
                                        scalable: true,
                                        'initial-center-size': 'contain',
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

                        {/* Presets Panel */}
                        <div className="w-64 border-l bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                            <FilterPresets processing={processing} camanFilters={camanFilters} applyFilter={applyFilter} />
                        </div>
                    </div>

                    {/* Bottom Toolbar */}
                    <div className="flex items-center justify-center space-x-2 border-t bg-gray-50 px-6 py-2 dark:border-gray-700 dark:bg-gray-800">
                        <Button variant="outline" disabled={processing || !hasChanged} onClick={() => handleOperation('reset')}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Reset
                        </Button>

                        <Button variant="outline" disabled={processing || !croppedByUser} onClick={() => handleOperation('clear')}>
                            Clear
                        </Button>

                        <Button disabled={processing || !hasChanged} onClick={handleSave}>
                            {processing ? 'Saving...' : 'Apply Changes'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
