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
    const cropperRef = useRef<Cropper | null>(null);
    const filterProcessorRef = useRef<ImageFilterProcessor | null>(null);
    const initDataRef = useRef<string | null>(null);
    const rotation = 45; // degrees per rotation step

    // Initialize the editor when opened
    useEffect(() => {
        if (isOpen && asset) {
            setProcessing(true);
            // Small delay to ensure image is rendered
            setTimeout(() => {
                initializeCropper();
            }, 500);
        }

        return () => {
            if (cropperRef.current) {
                cropperRef.current.destroy();
                cropperRef.current = null;
            }
        };
    }, [isOpen, asset]);

    const initializeCropper = useCallback(async () => {
        if (!imageRef.current || !asset) return;

        const image = imageRef.current;

        // Initialize filter processor
        filterProcessorRef.current = new ImageFilterProcessor();
        await filterProcessorRef.current.loadImage(asset.url);

        // Initialize CropperJS
        cropperRef.current = new Cropper(image, {
            viewMode: 1,
            dragMode: dragMode,
            guides: false,
            highlight: false,
            autoCrop: false,
            toggleDragModeOnDblclick: true,
            responsive: false,
            ready: () => {
                setProcessing(false);
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
    }, [asset, dragMode]);

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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[95vh] w-full max-w-[90vw] overflow-hidden p-0">
                <DialogHeader className="border-b px-6 py-4">
                    <DialogTitle>Image Editor - {asset.filename}</DialogTitle>
                </DialogHeader>

                <div className="image-editor flex h-[80vh] flex-col">
                    {/* Top Toolbar */}
                    <div className="flex items-center justify-between border-b bg-gray-50 px-6 py-3">
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
                    <div className="flex flex-1 overflow-hidden">
                        {/* Side Controls */}
                        <div className="flex w-16 flex-col items-center space-y-2 border-r bg-gray-50 py-4">
                            <ImageControls dragMode={dragMode} onOperation={handleOperation} processing={processing} />
                        </div>

                        {/* Image Area */}
                        <div className="relative flex flex-1 items-center justify-center bg-gray-100">
                            {processing && (
                                <div className="bg-opacity-75 absolute inset-0 z-10 flex items-center justify-center bg-white">
                                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                                </div>
                            )}

                            <div className="max-h-full max-w-full">
                                <img
                                    ref={imageRef}
                                    src={asset.url}
                                    alt={asset.filename}
                                    className="max-h-full max-w-full"
                                    crossOrigin="anonymous"
                                    style={{ opacity: processing ? 0 : 1 }}
                                />
                            </div>
                        </div>

                        {/* Presets Panel */}
                        <div className="w-64 border-l bg-gray-50 p-4">
                            <FilterPresets processing={processing} camanFilters={camanFilters} applyFilter={applyFilter} />
                        </div>
                    </div>

                    {/* Bottom Toolbar */}
                    <div className="flex items-center justify-center space-x-2 border-t bg-gray-50 px-6 py-3">
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
