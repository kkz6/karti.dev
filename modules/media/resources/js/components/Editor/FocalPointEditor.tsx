import { Button } from '@shared/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@shared/components/ui/dialog';
import { Slider } from '@shared/components/ui/slider';
import { Minus, Plus } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface FocalPointEditorProps {
    isOpen: boolean;
    image: string;
    initialFocus?: string; // Format: "x-y" (e.g., "50-50")
    onSelect: (focus: string) => void;
    onClose: () => void;
}

export const FocalPointEditor: React.FC<FocalPointEditorProps> = ({ isOpen, image, initialFocus = '50-50', onSelect, onClose }) => {
    const [x, setX] = useState(50);
    const [y, setY] = useState(50);
    const [pointerSize, setPointerSize] = useState(16); // Size of the focal point reticle
    const [isDragging, setIsDragging] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);

    // Initialize coordinates from initial focus data
    useEffect(() => {
        if (initialFocus) {
            const coords = initialFocus.split('-');
            setX(parseInt(coords[0]) || 50);
            setY(parseInt(coords[1]) || 50);
        }
    }, [initialFocus]);

    // Handle global mouse events during dragging
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                updateCoordinatesFromMouse(e.clientX, e.clientY);
            }
        };

        const handleGlobalMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging]);

    // Helper function to update coordinates from mouse position
    const updateCoordinatesFromMouse = (clientX: number, clientY: number) => {
        if (!imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();
        const imageW = rect.width;
        const imageH = rect.height;

        const offsetX = clientX - rect.left;
        const offsetY = clientY - rect.top;

        const newX = Math.round((offsetX / imageW) * 100);
        const newY = Math.round((offsetY / imageH) * 100);

        setX(Math.max(0, Math.min(100, newX)));
        setY(Math.max(0, Math.min(100, newY)));
    };

    // Handle image click to set focal point
    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isDragging) {
            updateCoordinatesFromMouse(e.clientX, e.clientY);
        }
    };

    // Handle pointer drag start
    const handlePointerMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    // Handle mouse move during drag
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            updateCoordinatesFromMouse(e.clientX, e.clientY);
        }
    };

    // Handle mouse up to end drag
    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleSelect = () => {
        onSelect(`${x}-${y}`);
        onClose();
    };

    const handleReset = () => {
        setX(50);
        setY(50);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Focal Point Editor</DialogTitle>
                </DialogHeader>

                <div className="focal-point-editor">
                    <div className="mb-6">
                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Click or drag to adjust the focal point
                        </label>
                        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                            Click anywhere on the image or drag the red circle to set the focal point. This determines which part of the image stays
                            visible when cropping.
                        </p>

                        {/* Pointer Size Controls */}
                        <div className="mb-4 flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pointer Size:</span>
                            <div className="flex items-center space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPointerSize(Math.max(8, pointerSize - 4))}
                                    disabled={pointerSize <= 8}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>
                                <div className="w-32">
                                    <Slider
                                        value={[pointerSize]}
                                        onValueChange={(value) => setPointerSize(value[0])}
                                        max={40}
                                        min={8}
                                        step={4}
                                        className="w-full"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPointerSize(Math.min(40, pointerSize + 4))}
                                    disabled={pointerSize >= 40}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-gray-600 dark:text-gray-400">{pointerSize}px</span>
                            </div>
                        </div>

                        {/* Main focal point image */}
                        <div
                            className="relative inline-block overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                        >
                            <img
                                ref={imageRef}
                                src={image}
                                alt="Focal point editor"
                                className="max-h-80 max-w-md cursor-crosshair"
                                onClick={handleImageClick}
                                draggable={false}
                            />
                            {/* Focal point reticle */}
                            <div
                                className={`absolute rounded-full border-2 border-red-500 transition-colors ${
                                    isDragging ? 'cursor-grabbing bg-red-100' : 'cursor-grab hover:bg-red-50'
                                }`}
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    width: `${pointerSize}px`,
                                    height: `${pointerSize}px`,
                                    marginLeft: `${-pointerSize / 2}px`,
                                    marginTop: `${-pointerSize / 2}px`,
                                }}
                                onMouseDown={handlePointerMouseDown}
                            >
                                <div className="absolute inset-0 rounded-full bg-red-500 opacity-50"></div>
                                {/* Drag indicator - small crosshair in center */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-2 w-2">
                                        <div className="absolute top-0 left-1/2 h-2 w-0.5 -translate-x-1/2 bg-white"></div>
                                        <div className="absolute top-1/2 left-0 h-0.5 w-2 -translate-y-1/2 bg-white"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coordinates display */}
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">X:</span>
                                <span className="text-sm text-gray-900 dark:text-gray-100">{x}%</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Y:</span>
                                <span className="text-sm text-gray-900 dark:text-gray-100">{y}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <div className="flex space-x-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button variant="outline" onClick={handleReset}>
                            Reset
                        </Button>
                        <Button onClick={handleSelect}>Select</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
