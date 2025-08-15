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
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';
import { FilterOptions, ImageFilterProcessor } from '../utils/imageFilters';

// CropperJS v1.6.2 interface
interface CropperData {
    rotate: number;
    scaleX: number;
    scaleY: number;
}

interface ImageEditorProps {
    asset: MediaAsset | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved?: (asset: MediaAsset) => void;
}

interface CropperData {
    rotate: number;
    scaleX: number;
    scaleY: number;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ asset, isOpen, onClose, onSaved }) => {
    const [processing, setProcessing] = useState(false);
    const [hasChanged, setHasChanged] = useState(false);
    const [dragMode, setDragMode] = useState<'move' | 'crop'>('move');
    const [croppedByUser, setCroppedByUser] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const [diffDisable, setDiffDisable] = useState(true);
    const [camanFilters, setCamanFilters] = useState<FilterOptions>({});

    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cropperRef = useRef<Cropper | null>(null);
    const filterProcessorRef = useRef<ImageFilterProcessor | null>(null);
    const initDataRef = useRef<string | null>(null);
    const rotation = 45; // degrees per rotation step

    const fitImageToContainer = useCallback(() => {
        const cropper = cropperRef.current;
        const containerEl = containerRef.current;
        if (!cropper || !containerEl) return;

        const rect = containerEl.getBoundingClientRect();
        const container = { width: rect.width, height: rect.height } as { width: number; height: number };
        const imageData = cropper.getImageData();

        if (!container.width || !container.height || !imageData.naturalWidth || !imageData.naturalHeight) return;

        // Use max to "cover" the container and ensure full height is used
        const scale = Math.max(container.width / imageData.naturalWidth, container.height / imageData.naturalHeight);

        // Zoom around the center so the image stays centered
        cropper.zoomTo(scale, { x: container.width / 2, y: container.height / 2 });
    }, []);

    const initializeCropper = useCallback(async () => {
        if (!imageRef.current || !asset) {
            console.log('ImageEditor: Missing imageRef or asset');
            setProcessing(false);
            return;
        }

        const image = imageRef.current;
        console.log('ImageEditor: Image element found, initializing...');

        try {
            // Initialize filter processor
            filterProcessorRef.current = new ImageFilterProcessor();
            console.log('ImageEditor: Loading image into filter processor...');
            await filterProcessorRef.current.loadImage(asset.url);
            console.log('ImageEditor: Filter processor loaded successfully');

            // Initialize CropperJS
            console.log('ImageEditor: Initializing CropperJS...');
            cropperRef.current = new Cropper(image, {
                viewMode: 1,
                dragMode: dragMode,
                guides: false,
                highlight: false,
                autoCrop: false,
                toggleDragModeOnDblclick: true,
                responsive: true,
                checkOrientation: false,
                restore: false,
                center: true,
                scalable: true,
                zoomable: true,
                zoomOnWheel: false,
                cropBoxMovable: true,
                cropBoxResizable: true,
                background: true,
                modal: true,
                ready: () => {
                    console.log('ImageEditor: CropperJS ready callback triggered');

                    // Force cropper to recalculate and fit the container
                    fitImageToContainer();

                    setProcessing(false);
                    console.log('ImageEditor: Processing set to false');
                    if (!initDataRef.current && cropperRef.current) {
                        const canvas = cropperRef.current.getCroppedCanvas();
                        initDataRef.current = canvas.toDataURL();
                    }
                },
                cropmove: (e: any) => {
                    const action = e.detail.action;
                    switch (action) {
                        case 'move':
                        case 'crop':
                            setCroppedByUser(true);
                            setHasChanged(true);
                            break;
                        case 'zoom':
                            setHasChanged(true);
                            break;
                    }
                },
                zoom: () => {
                    setHasChanged(true);
                },
            });
            console.log('ImageEditor: CropperJS initialized successfully');

            // Set processing to false immediately after initialization
            // The ready callback might not always fire reliably
            console.log('ImageEditor: Setting processing to false after initialization');
            setProcessing(false);
        } catch (error) {
            console.error('ImageEditor: Error during initialization:', error);
            setProcessing(false);
        }
    }, [asset, dragMode, fitImageToContainer]);

    // Initialize the editor when opened
    useEffect(() => {
        if (isOpen && asset) {
            setProcessing(true);
            console.log('ImageEditor: Starting initialization for asset:', asset.filename);
            // Small delay to ensure image is rendered
            setTimeout(() => {
                initializeCropper().catch((error) => {
                    console.error('Error initializing cropper:', error);
                    setProcessing(false);
                });
            }, 500);
        }

        return () => {
            if (cropperRef.current && typeof cropperRef.current.destroy === 'function') {
                try {
                    cropperRef.current.destroy();
                } catch (error) {
                    console.warn('Error destroying cropper:', error);
                }
                cropperRef.current = null;
            }
        };
    }, [isOpen, asset, initializeCropper]);

    // Refit on container resize or window resize
    useEffect(() => {
        if (!isOpen) return;

        const handleResize = () => fitImageToContainer();
        window.addEventListener('resize', handleResize);

        let observer: ResizeObserver | null = null;
        if (containerRef.current && 'ResizeObserver' in window) {
            observer = new ResizeObserver(() => fitImageToContainer());
            observer.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (observer && containerRef.current) observer.disconnect();
        };
    }, [isOpen, fitImageToContainer]);

    const handleOperation = useCallback(
        (action: string) => {
            const cropper = cropperRef.current;
            if (!cropper) return;

            const getData = (): CropperData => cropper.getData() as CropperData;

            switch (action) {
                case 'move':
                case 'crop':
                    setDragMode(action as 'move' | 'crop');
                    cropper.setDragMode(action);
                    break;

                case 'zoom-in':
                    cropper.zoom(0.1);
                    setHasChanged(true);
                    break;

                case 'zoom-out':
                    cropper.zoom(-0.1);
                    setHasChanged(true);
                    break;

                case 'rotate-left':
                    cropper.rotate(-rotation);
                    break;

                case 'rotate-right':
                    cropper.rotate(rotation);
                    break;

                case 'flip-horizontal':
                    const currentData = getData();
                    const ranges = getRotationRanges();
                    if (ranges.includes(currentData.rotate)) {
                        cropper.scaleY(-currentData.scaleY);
                    } else {
                        cropper.scaleX(-currentData.scaleX);
                    }
                    break;

                case 'flip-vertical':
                    const data = getData();
                    const rotRanges = getRotationRanges();
                    if (rotRanges.includes(data.rotate)) {
                        cropper.scaleX(-data.scaleX);
                    } else {
                        cropper.scaleY(-data.scaleY);
                    }
                    break;

                case 'reset':
                    resetAll();
                    break;

                case 'clear':
                    setCroppedByUser(false);
                    cropper.clear();
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
        const cropper = cropperRef.current;
        if (!cropper) return;

        const data = cropper.getData() as CropperData;
        const hasFilters = Object.keys(camanFilters).length > 0;

        const cropBoxData = cropper.getCropBoxData();
        const hasCrop = cropBoxData.width > 0 && cropBoxData.height > 0;
        setHasChanged(data.rotate !== 0 || data.scaleX !== 1 || data.scaleY !== 1 || hasCrop || hasFilters);
    }, [camanFilters]);

    const resetAll = useCallback(() => {
        const cropper = cropperRef.current;
        if (!cropper) return;

        setDragMode('move');
        setHasChanged(false);
        setCroppedByUser(false);
        setDiffDisable(true);
        setCamanFilters({});

        cropper.reset();
        cropper.clear();
        cropper.setDragMode('move');

        // Reset filters would go here when CamanJS is integrated
    }, []);

    const getCropperData = useCallback(
        (cropper: Cropper = cropperRef.current!) => {
            if (!cropper || !asset) return null;

            // If user hasn't made a crop selection, create one
            if (!croppedByUser) {
                cropper.crop();
                const containerData = cropper.getContainerData();
                cropper.setCropBoxData({
                    height: containerData.height,
                    left: 0,
                    top: 0,
                    width: containerData.width,
                });
            }

            const canvas = cropper.getCroppedCanvas({
                fillColor: asset.mime_type?.includes('png') ? 'transparent' : '#fff',
                imageSmoothingQuality: 'high',
            });

            return canvas.toDataURL(asset.mime_type);
        },
        [asset, croppedByUser],
    );

    const handleSave = useCallback(async () => {
        if (!asset || !cropperRef.current) return;

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

            // Update cropper with original image
            if (cropperRef.current) {
                cropperRef.current.replace(originalImageUrl, true);
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

                // Update cropper with filtered image
                if (cropperRef.current) {
                    cropperRef.current.replace(filteredImageUrl, true);
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

    if (!asset) return null;

    return (
        <>
            <style>{`
                /* Cropper container */
                .__cropper {
                    position: relative;
                    height: 100%;
                    flex: 1;
                    overflow: hidden;
                }

                /* Image container - fill available space */
                .__cropper .image {
                    display: block;
                    width: 100%;
                    height: 100%;
                    min-height: 0;
                    position: relative;
                }

                /* Original image (hidden by cropper) */
                .__cropper .image img {
                    display: block;
                    max-width: 100%;
                    max-height: 100%;
                }

                /* Loader from original */
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
                }

                /* Force CropperJS container to fill space */
                .cropper-container {
                    direction: ltr;
                    font-size: 0;
                    line-height: 0;
                    position: relative;
                    touch-action: none;
                    user-select: none;
                    width: 100% !important;
                    height: 100% !important;
                }

                .cropper-wrap-box,
                .cropper-canvas,
                .cropper-drag-box,
                .cropper-crop-box,
                .cropper-modal {
                    bottom: 0;
                    left: 0;
                    position: absolute;
                    right: 0;
                    top: 0;
                }

                .cropper-drag-box {
                    background-color: transparent;
                    opacity: 1;
                }

                /* Add checkered background pattern */
                .__cropper {
                    background-image:
                        linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                        linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                        linear-gradient(-45deg, transparent 75%, #e5e7eb 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                }

                /* Ensure cropper uses full width */
                .cropper-container {
                    position: relative !important;
                    touch-action: none;
                    user-select: none;
                }

                /* Absolutely fill the image box so height always matches */
                .__cropper .image > .cropper-container {
                    position: absolute !important;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    left: 0;
                    width: 100% !important;
                    height: 100% !important;
                }

                /* Ensure the cropper modal image fits the container */
                .cropper-modal {
                    background-color: rgba(0, 0, 0, 0.5);
                }

                .cropper-view-box {
                    outline: 1px solid rgba(255, 255, 255, 0.75);
                }

                /* Cropper styling from original Laravel Media Manager */
                .cropper-line {
                    background-color: transparent !important;
                }

                .cropper-point {
                    z-index: 1;
                }

                .cropper-point.point-e,
                .cropper-point.point-w,
                .cropper-point.point-s,
                .cropper-point.point-n {
                    background-color: transparent !important;
                }

                .cropper-point.point-ne,
                .cropper-point.point-se,
                .cropper-point.point-nw,
                .cropper-point.point-sw {
                    background-color: transparent !important;
                    border-color: white;
                    border-style: solid;
                    height: 20px;
                    width: 20px;
                }

                .cropper-point.point-ne {
                    border-width: 3px 3px 0 0;
                }

                .cropper-point.point-nw {
                    border-width: 3px 0 0 3px;
                }

                .cropper-point.point-se {
                    border-width: 0 3px 3px 0;
                }

                .cropper-point.point-sw {
                    border-width: 0 0 3px 3px;
                }
            `}</style>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="h-[95vh] !w-[95vw] !max-w-[95vw] grid-rows-[auto_1fr] gap-0 overflow-hidden p-0">
                    <DialogHeader className="border-b px-6 py-3">
                        <DialogTitle>Image Editor - {asset.filename}</DialogTitle>
                    </DialogHeader>

                    <div className="image-editor flex min-h-0 flex-col">
                        {/* Top Toolbar */}
                        <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-2">
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
                            <div className="flex w-16 flex-col items-center space-y-2 border-r bg-gray-50 py-2">
                                <ImageControls dragMode={dragMode} onOperation={handleOperation} processing={processing} />
                            </div>

                            {/* Image Area */}
                            <div ref={containerRef} className="__cropper relative min-h-0 flex-1 bg-gray-100">
                                {processing && (
                                    <div className="__loader">
                                        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                                    </div>
                                )}

                                <div className="image" style={{ opacity: processing ? 0 : 1, width: '100%', height: '100%' }}>
                                    <img
                                        ref={imageRef}
                                        id="cropper"
                                        src={asset.url}
                                        alt={asset.filename}
                                        crossOrigin="anonymous"
                                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                                        onLoad={() => console.log('ImageEditor: Image loaded successfully')}
                                        onError={(e) => console.error('ImageEditor: Image load error:', e)}
                                    />
                                </div>
                            </div>

                            {/* Presets Panel */}
                            <div className="w-64 border-l bg-gray-50 p-4">
                                <FilterPresets processing={processing} camanFilters={camanFilters} applyFilter={applyFilter} />
                            </div>
                        </div>

                        {/* Bottom Toolbar */}
                        <div className="flex items-center justify-center space-x-2 border-t bg-gray-50 px-6 py-2">
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
