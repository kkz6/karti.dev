import { Button } from '@shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/components/ui/tooltip';
import { Crop, FlipHorizontal, FlipVertical, Move, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import React from 'react';

interface Control {
    trans: string;
    op: string;
    mode?: string;
    icon: React.ReactNode;
}

interface ImageControlsProps {
    dragMode: 'move' | 'crop';
    onOperation: (action: string) => void;
    processing: boolean;
}

export const ImageControls: React.FC<ImageControlsProps> = ({ dragMode, onOperation, processing }) => {
    const controls: Control[] = [
        {
            trans: 'Move',
            op: 'move',
            mode: 'move',
            icon: <Move className="h-4 w-4" />,
        },
        {
            trans: 'Crop',
            op: 'crop',
            mode: 'crop',
            icon: <Crop className="h-4 w-4" />,
        },
        {
            trans: 'Zoom In',
            op: 'zoom-in',
            icon: <ZoomIn className="h-4 w-4" />,
        },
        {
            trans: 'Zoom Out',
            op: 'zoom-out',
            icon: <ZoomOut className="h-4 w-4" />,
        },
        {
            trans: 'Rotate Left',
            op: 'rotate-left',
            icon: <RotateCcw className="h-4 w-4" />,
        },
        {
            trans: 'Rotate Right',
            op: 'rotate-right',
            icon: <RotateCw className="h-4 w-4" />,
        },
        {
            trans: 'Flip Horizontal',
            op: 'flip-horizontal',
            icon: <FlipHorizontal className="h-4 w-4" />,
        },
        {
            trans: 'Flip Vertical',
            op: 'flip-vertical',
            icon: <FlipVertical className="h-4 w-4" />,
        },
    ];

    return (
        <TooltipProvider>
            <div className="flex flex-col space-y-2">
                {controls.map((control) => (
                    <Tooltip key={control.op}>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                disabled={processing}
                                className={`h-12 w-12 p-0 ${
                                    control.mode && dragMode === control.mode ? 'border-blue-300 bg-blue-100 text-blue-700' : ''
                                }`}
                                onClick={() => onOperation(control.op)}
                            >
                                {processing ? <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600"></div> : control.icon}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{control.trans}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
};
