import type { LucideIcon } from 'lucide-react';
import { PackageOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
interface EmptyStateProps {
    title: string;
    description?: string;
    icons?: LucideIcon[];
    action?: { label: string; onClick: () => void; disabled?: boolean };
    className?: string;
}
export function EmptyState({ title, description, icons = [], action, className }: EmptyStateProps) {
    const Icon = icons[0] ?? PackageOpen;
    return (
        <div
            className={cn(
                'border-border/70 bg-muted/15 flex w-full flex-col items-center justify-center rounded-lg border px-6 py-14 text-center',
                className,
            )}
        >
            <div className="bg-muted mb-4 grid size-12 place-items-center rounded-full">
                <Icon className="text-muted-foreground size-5" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {description && <p className="text-muted-foreground mt-2 max-w-sm text-sm leading-6">{description}</p>}
            {action && (
                <Button className="mt-5" onClick={action.onClick} disabled={action.disabled}>
                    {action.label}
                </Button>
            )}
        </div>
    );
}
