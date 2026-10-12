import { Button } from '@shared/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@shared/components/ui/tooltip';
import { cn } from '@shared/lib/utils';
import type { ComponentProps } from 'react';

/** Matches the table package's compact row controls, including links and menu triggers. */
export function RowActionButton({
    label,
    tooltip = label,
    destructive = false,
    className,
    children,
    ...props
}: Omit<ComponentProps<typeof Button>, 'size' | 'variant'> & { label: string; tooltip?: string; destructive?: boolean }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    {...props}
                    variant={destructive ? 'destructiveGhost' : 'ghost'}
                    size="icon"
                    aria-label={label}
                    className={cn('it-row-action-icon-button', className)}
                >
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
}
