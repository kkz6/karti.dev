import { Button } from '@shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/components/ui/tooltip';
import { Crop, FlipHorizontal, FlipVertical, Move, RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

const tools = [
    { label: 'Move', action: 'move', icon: Move, mode: true },
    { label: 'Crop', action: 'crop', icon: Crop, mode: true },
    { label: 'Zoom in', action: 'zoom-in', icon: ZoomIn },
    { label: 'Zoom out', action: 'zoom-out', icon: ZoomOut },
    { label: 'Rotate left', action: 'rotate-left', icon: RotateCcw },
    { label: 'Rotate right', action: 'rotate-right', icon: RotateCw },
    { label: 'Flip horizontal', action: 'flip-horizontal', icon: FlipHorizontal },
    { label: 'Flip vertical', action: 'flip-vertical', icon: FlipVertical },
];

export function ImageControls({
    dragMode,
    onOperation,
    processing,
}: {
    dragMode: 'move' | 'crop';
    onOperation: (action: string) => void;
    processing: boolean;
}) {
    return (
        <TooltipProvider delayDuration={400}>
            <div role="group" aria-label="Image tools" className="flex shrink-0 items-center gap-1">
                {tools.map(({ label, action, icon: Icon, mode }) => (
                    <Tooltip key={action}>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant={mode && dragMode === action ? 'secondary' : 'ghost'}
                                size={mode ? 'sm' : 'icon'}
                                className={mode ? 'gap-1.5' : 'size-9'}
                                disabled={processing}
                                aria-label={label}
                                aria-pressed={mode ? dragMode === action : undefined}
                                onClick={() => onOperation(action)}
                            >
                                <Icon className="size-4" />
                                {mode && label}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
}
