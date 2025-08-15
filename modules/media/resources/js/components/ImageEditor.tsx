import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import axios from 'axios';
import { Code, RotateCcw, X } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MediaAsset } from '../types/media';
import { FilterPresets } from './FilterPresets';
import { ImageControls } from './ImageControls';
import { ImageFilters } from './ImageFilters';

// Import the required libraries
import 'cropperjs';
import { FilterOptions, ImageFilterProcessor } from '../utils/imageFilters';

// CropperJS v2 web component interfaces
declare global {
    interface CropperImageElement extends HTMLElement {
        src: string;
        translatable: boolean;
        rotatable: boolean;
        scalable: boolean;
        naturalWidth: number;
        naturalHeight: number;
        $ready(): Promise<void>;
        $move(x: number, y: number): void;
        $moveTo(x: number, y: number): void;
        $rotate(angle: number): void;
        $scale(scaleX: number, scaleY?: number): void;
        $setTransform(transform: { x?: number; y?: number; rotate?: number; scaleX?: number; scaleY?: number }): void;
        $getTransform(): { x: number; y: number; rotate: number; scaleX: number; scaleY: number };
        $resetTransform(): void;
    }

    interface CropperSelectionElement extends HTMLElement {
        x: number;
        y: number;
        width: number;
        height: number;
        aspectRatio: number;
        initialCoverage: number;
        movable: boolean;
        resizable: boolean;
        hidden: boolean;
        $change(): void;
        $reset(): void;
        $toCanvas(options?: { fillColor?: string; imageSmoothingQuality?: string }): HTMLCanvasElement;
    }

    interface CropperCanvasElement extends HTMLElement {
        disabled: boolean;
        background: boolean;
        scaleStep: number;
    }

    interface CropperHandleElement extends HTMLElement {
        action: 'select' | 'move' | 'n-resize' | 'e-resize' | 's-resize' | 'w-resize' | 'ne-resize' | 'nw-resize' | 'se-resize' | 'sw-resize';
        plain?: boolean;
    }
}

// Extend JSX intrinsic elements for v2 web components
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'cropper-canvas': React.DetailedHTMLProps<React.HTMLAttributes<CropperCanvasElement>, CropperCanvasElement> & {
                disabled?: boolean;
                background?: boolean;
                'scale-step'?: number;
            };
            'cropper-image': React.DetailedHTMLProps<React.HTMLAttributes<CropperImageElement>, CropperImageElement> & {
                src?: string;
                translatable?: boolean;
                rotatable?: boolean;
                scalable?: boolean;
            };
            'cropper-selection': React.DetailedHTMLProps<React.HTMLAttributes<CropperSelectionElement>, CropperSelectionElement> & {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
                'aspect-ratio'?: number;
                'initial-coverage'?: number;
                movable?: boolean;
                resizable?: boolean;
                hidden?: boolean;
            };
            'cropper-handle': React.DetailedHTMLProps<React.HTMLAttributes<CropperHandleElement>, CropperHandleElement> & {
                action?:
                    | 'select'
                    | 'move'
                    | 'n-resize'
                    | 'e-resize'
                    | 's-resize'
                    | 'w-resize'
                    | 'ne-resize'
                    | 'nw-resize'
                    | 'se-resize'
                    | 'sw-resize';
                plain?: boolean;
                'theme-color'?: string;
            };
            'cropper-shade': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
            'cropper-grid': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                role?: string;
                bordered?: boolean;
                covered?: boolean;
            };
            'cropper-crosshair': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                centered?: boolean;
            };
            'cropper-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}

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
    const [camanFilters, setCamanFilters] = useState<FilterOptions>({});

    const cropperCanvasRef = useRef<CropperCanvasElement>(null);
    const cropperImageRef = useRef<CropperImageElement>(null);
    const cropperSelectionRef = useRef<CropperSelectionElement>(null);
    const cropperHandleRef = useRef<CropperHandleElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const filterProcessorRef = useRef<ImageFilterProcessor | null>(null);
    const initDataRef = useRef<string | null>(null);
    const rotation = 45; // degrees per rotation step

    const initializeCropper = useCallback(async () => {
        if (!cropperImageRef.current || !asset) {
            console.log('ImageEditor: Missing cropper image element or asset');
            setProcessing(false);
            return;
        }

        try {
            // Initialize filter processor
            filterProcessorRef.current = new ImageFilterProcessor();
            console.log('ImageEditor: Loading image into filter processor...');
            await filterProcessorRef.current.loadImage(asset.url);
            console.log('ImageEditor: Filter processor loaded successfully');

            // Set up the cropper image element
            const cropperImage = cropperImageRef.current;
            cropperImage.src = asset.url;
            cropperImage.translatable = true;
            cropperImage.rotatable = true;
            cropperImage.scalable = true;

            // Set up the cropper selection element
            const cropperSelection = cropperSelectionRef.current;
            if (cropperSelection) {
                cropperSelection.initialCoverage = 0; // autoCrop: false equivalent
                cropperSelection.movable = true;
                cropperSelection.resizable = true;
                cropperSelection.hidden = true; // Start without selection
            }

            // Set up the cropper canvas element
            const cropperCanvas = cropperCanvasRef.current;
            if (cropperCanvas) {
                cropperCanvas.disabled = false;
                cropperCanvas.background = true;
                cropperCanvas.scaleStep = 0.1; // wheelZoomRatio equivalent
            }

            // Set up the cropper handle element (main selection handle)
            const cropperHandle = cropperHandleRef.current;
            if (cropperHandle) {
                cropperHandle.action = 'select'; // This handle is for creating selections
                cropperHandle.plain = true;
            }

            // Wait for the image to be ready
            await cropperImage.$ready();
            console.log('ImageEditor: Cropper image ready');

            // Ensure selection is hidden initially
            if (cropperSelection) {
                cropperSelection.hidden = true;
            }

            setProcessing(false);
            console.log('ImageEditor: Processing set to false');
        } catch (error) {
            console.error('ImageEditor: Error during initialization:', error);
            setProcessing(false);
        }
    }, [asset, dragMode]);

    // Initialize the editor when opened
    useEffect(() => {
        if (isOpen && asset) {
            setProcessing(true);
            console.log('ImageEditor: Starting initialization for asset:', asset.filename);
            // Small delay to ensure web components are rendered
            setTimeout(() => {
                initializeCropper().catch((error) => {
                    console.error('Error initializing cropper:', error);
                    setProcessing(false);
                });
            }, 500);
        }

        // No cleanup needed for v2 web components - they handle their own lifecycle
    }, [isOpen, asset, initializeCropper]);

    const handleOperation = useCallback(
        (action: string) => {
            const cropperImage = cropperImageRef.current;
            const cropperSelection = cropperSelectionRef.current;
            const cropperHandle = cropperHandleRef.current;

            if (!cropperImage) return;

            const getData = () => cropperImage.$getTransform();

            switch (action) {
                case 'move':
                    setDragMode('move');
                    // The main handle remains as 'select' - move mode is handled differently in v2
                    break;

                case 'crop':
                    setDragMode('crop');
                    // The main handle remains as 'select' for creating crop selections
                    break;

                case 'zoom-in':
                    cropperImage.$scale(1.1, 1.1);
                    setHasChanged(true);
                    break;

                case 'zoom-out':
                    cropperImage.$scale(0.9, 0.9);
                    setHasChanged(true);
                    break;

                case 'rotate-left':
                    cropperImage.$rotate(-rotation);
                    break;

                case 'rotate-right':
                    cropperImage.$rotate(rotation);
                    break;

                case 'flip-horizontal':
                    const currentData = getData();
                    const ranges = getRotationRanges();
                    if (ranges.includes(currentData.rotate)) {
                        cropperImage.$scale(currentData.scaleX, -currentData.scaleY);
                    } else {
                        cropperImage.$scale(-currentData.scaleX, currentData.scaleY);
                    }
                    break;

                case 'flip-vertical':
                    const data = getData();
                    const rotRanges = getRotationRanges();
                    if (rotRanges.includes(data.rotate)) {
                        cropperImage.$scale(-data.scaleX, data.scaleY);
                    } else {
                        cropperImage.$scale(data.scaleX, -data.scaleY);
                    }
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
        },
        [rotation],
    );

    const getRotationRanges = () => {
        const angles = 360 / rotation;
        const list = Array.from(Array(angles).keys()).slice(1);
        const ranges: number[] = [];

        list.forEach((item) => {
            const res = item * rotation;
            if (res !== 180) {
                ranges.push(-res, res);
            }
        });

        return ranges;
    };

    const checkForChanges = useCallback(() => {
        const cropperImage = cropperImageRef.current;
        const cropperSelection = cropperSelectionRef.current;
        if (!cropperImage) return;

        const data = cropperImage.$getTransform();
        const hasFilters = Object.keys(camanFilters).length > 0;

        const hasCrop = cropperSelection ? cropperSelection.width > 0 && cropperSelection.height > 0 && !cropperSelection.hidden : false;
        setHasChanged(data.rotate !== 0 || data.scaleX !== 1 || data.scaleY !== 1 || hasCrop || hasFilters);
    }, [camanFilters]);

    const resetAll = useCallback(() => {
        const cropperImage = cropperImageRef.current;
        const cropperSelection = cropperSelectionRef.current;
        const cropperHandle = cropperHandleRef.current;
        if (!cropperImage) return;

        setDragMode('move');
        setHasChanged(false);
        setCroppedByUser(false);
        setDiffDisable(true);
        setCamanFilters({});

        cropperImage.$resetTransform();
        if (cropperSelection) {
            cropperSelection.$reset();
            cropperSelection.hidden = true;
        }
        if (cropperHandle) {
            cropperHandle.action = 'move';
        }

        // Reset filters would go here when CamanJS is integrated
    }, []);

    const getCropperData = useCallback(() => {
        const cropperSelection = cropperSelectionRef.current;
        const cropperImage = cropperImageRef.current;
        if (!cropperSelection || !asset || !cropperImage) return null;

        // If user hasn't made a crop selection, create a temporary one that covers the full image
        if (!croppedByUser || cropperSelection.hidden) {
            // Show the selection temporarily and set it to cover the entire visible image
            cropperSelection.hidden = false;

            // Use the natural image dimensions or fall back to reasonable defaults
            const width = cropperImage.naturalWidth || 800;
            const height = cropperImage.naturalHeight || 600;

            // Set selection to cover the entire image area
            cropperSelection.x = 0;
            cropperSelection.y = 0;
            cropperSelection.width = width;
            cropperSelection.height = height;
        }

        const canvas = cropperSelection.$toCanvas({
            fillColor: asset.mime_type?.includes('png') ? 'transparent' : '#fff',
            imageSmoothingQuality: 'high',
        });

        // Hide the selection again if user didn't create it
        if (!croppedByUser) {
            cropperSelection.hidden = true;
        }

        return canvas.toDataURL(asset.mime_type);
    }, [asset, croppedByUser]);

    const handleSave = useCallback(async () => {
        if (!asset || !cropperSelectionRef.current) return;

        const imageData = getCropperData();
        if (!imageData) return;

        setProcessing(true);

        try {
            const response = await axios.post(route('media.image-editor.save'), {
                data: imageData,
                path: '', // You may need to adjust this based on your backend
                name: asset.filename,
                mime_type: asset.mime_type,
            });

            if (response.data.success) {
                onSaved?.(response.data.asset);
                onClose();
            } else {
                console.error('Save failed:', response.data.message);
            }
        } catch (error) {
            console.error('Error saving image:', error);
        } finally {
            setProcessing(false);
        }
    }, [asset, getCropperData, onSaved, onClose]);

    const toggleDiff = useCallback(() => {
        setShowDiff(!showDiff);
    }, [showDiff]);

    const resetFilters = useCallback(() => {
        if (!filterProcessorRef.current) return;

        setDiffDisable(true);
        setCamanFilters({});

        try {
            // Reset to original image
            const originalImageUrl = filterProcessorRef.current.reset();

            // Update cropper image with original image
            if (cropperImageRef.current) {
                cropperImageRef.current.src = originalImageUrl;
            }
        } catch (error) {
            console.error('Error resetting filters:', error);
        }
    }, []);

    const applyFilter = useCallback(
        async (name: string, value: any) => {
            if (!filterProcessorRef.current) return;

            setHasChanged(true);
            setProcessing(true);

            let filters = { ...camanFilters };

            // Remove filter if value is null/empty
            if (!value && Object.prototype.hasOwnProperty.call(filters, name)) {
                delete (filters as any)[name];
            } else if (value !== null && value !== undefined) {
                (filters as any)[name] = value;
            }

            setCamanFilters(filters);

            try {
                // Apply all filters
                const filteredImageUrl = filterProcessorRef.current.applyFilters(filters);

                // Update cropper image with filtered image
                if (cropperImageRef.current) {
                    cropperImageRef.current.src = filteredImageUrl;
                }
            } catch (error) {
                console.error('Error applying filter:', error);
            } finally {
                setProcessing(false);
            }
        },
        [camanFilters],
    );

    const haveFilters = () => Object.keys(camanFilters).length > 0;

    // Add event listeners for v2 components
    useEffect(() => {
        if (!isOpen || !cropperCanvasRef.current) return;

        const canvas = cropperCanvasRef.current;

        const handleActionStart = (e: Event) => {
            const customEvent = e as CustomEvent;
            const action = customEvent.detail?.action;
            console.log('Action start:', action);
            if (action === 'select' || action?.includes('resize')) {
                setCroppedByUser(true);
                // Show the selection when user starts creating/resizing a selection
                const cropperSelection = cropperSelectionRef.current;
                if (cropperSelection) {
                    cropperSelection.hidden = false;
                }
            }
        };

        const handleActionMove = (e: Event) => {
            const customEvent = e as CustomEvent;
            const action = customEvent.detail?.action;
            switch (action) {
                case 'select':
                case 'move':
                    setCroppedByUser(true);
                    setHasChanged(true);
                    break;
                default:
                    if (action?.includes('resize')) {
                        setCroppedByUser(true);
                        setHasChanged(true);
                    }
                    break;
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
        <>
            <style>{`
                /* Cropper v2 container */
                .__cropper {
                    position: relative;
                    height: 100%;
                    flex: 1;
                    overflow: hidden;
                    background-image:
                        linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                        linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                        linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                }

                /* Dark mode checkered background pattern */
                @media (prefers-color-scheme: dark) {
                    .__cropper {
                        background-image:
                            linear-gradient(45deg, #374151 25%, transparent 25%),
                            linear-gradient(-45deg, #374151 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, #374151 75%),
                            linear-gradient(-45deg, transparent 75%, #374151 75%);
                    }
                }

                /* Loader */
                .__cropper .__loader {
                    align-items: center;
                    display: flex;
                    height: 100%;
                    justify-content: center;
                    left: 0;
                    opacity: 0.5;
                    position: absolute;
                    top: 0;
                    width: 100%;
                    z-index: 10;
                }

                /* Cropper v2 web components styling */
                cropper-canvas {
                    display: block;
                    width: 100%;
                    height: 100%;
                }

                cropper-image {
                    display: block;
                    width: 100%;
                    height: 100%;
                }

                cropper-selection {
                    display: block;
                }

                cropper-handle {
                    display: block;
                }

                cropper-shade {
                    display: block;
                }

                cropper-grid {
                    display: block;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }



                cropper-crosshair {
                    display: block;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                }

                /* Hide corner bracket lines */
                cropper-grid::before,
                cropper-grid::after,
                cropper-selection::before,
                cropper-selection::after {
                    display: none !important;
                }

                /* Hide any corner indicators */
                cropper-grid > *::before,
                cropper-grid > *::after {
                    display: none !important;
                }

                /* Override default cropper corner styling */
                cropper-selection {
                    border: 1px solid rgba(255, 255, 255, 0.5) !important;
                }

                /* Hide corner bracket pseudo-elements that might be creating the lines */
                cropper-selection > *::before,
                cropper-selection > *::after {
                    content: none !important;
                    display: none !important;
                }
            `}</style>
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
                                {/* Diff Toggle */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={processing || diffDisable}
                                    className={showDiff ? 'bg-blue-100' : ''}
                                    onClick={toggleDiff}
                                >
                                    <Code className="h-4 w-4" />
                                </Button>

                                {/* Reset Filters */}
                                <Button variant="outline" size="sm" disabled={processing || !haveFilters()} onClick={resetFilters}>
                                    <X className="h-4 w-4" />
                                </Button>
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

                                {React.createElement(
                                    'cropper-canvas',
                                    {
                                        ref: cropperCanvasRef,
                                        disabled: processing,
                                        background: true,
                                        'scale-step': 0.1,
                                        style: { opacity: processing ? 0 : 1, width: '100%', height: '100%' },
                                    },
                                    [
                                        React.createElement('cropper-image', {
                                            key: 'image',
                                            ref: cropperImageRef,
                                            src: asset.url,
                                            translatable: true,
                                            rotatable: true,
                                            scalable: true,
                                        }),
                                        React.createElement('cropper-shade', { key: 'shade' }),
                                        React.createElement('cropper-handle', {
                                            key: 'handle',
                                            ref: cropperHandleRef,
                                            action: 'select',
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
                                                    action: 'move',
                                                    'theme-color': 'rgba(255, 255, 255, 0.35)',
                                                }),
                                                React.createElement('cropper-handle', { key: 'n-resize', action: 'n-resize' }),
                                                React.createElement('cropper-handle', { key: 'e-resize', action: 'e-resize' }),
                                                React.createElement('cropper-handle', { key: 's-resize', action: 's-resize' }),
                                                React.createElement('cropper-handle', { key: 'w-resize', action: 'w-resize' }),
                                                React.createElement('cropper-handle', { key: 'ne-resize', action: 'ne-resize' }),
                                                React.createElement('cropper-handle', { key: 'nw-resize', action: 'nw-resize' }),
                                                React.createElement('cropper-handle', { key: 'se-resize', action: 'se-resize' }),
                                                React.createElement('cropper-handle', { key: 'sw-resize', action: 'sw-resize' }),
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
        </>
    );
};
