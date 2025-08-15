import { Button } from '@shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@shared/components/ui/tooltip';
import { LucideIcon } from 'lucide-react';
import React from 'react';

interface ActionButtonProps {
    action: () => void;
    icon: LucideIcon;
    tooltip: string;
    variant?: 'ghost' | 'outline' | 'default' | 'destructive' | 'secondary' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    action,
    icon: Icon,
    tooltip,
    variant = 'ghost',
    size = 'sm',
    className = '',
    disabled = false,
}) => {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant={variant} size={size} onClick={action} disabled={disabled} className={`h-8 w-8 p-0 ${className}`}>
                        <Icon className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
