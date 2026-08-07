import { cn } from '@shared/lib/utils';
import type { ReactNode } from 'react';

/**
 * Consistent page header for admin screens: eyebrow, title, supporting copy on
 * the left, actions pinned right. Admin pages previously each sized their own
 * <h1>, which is why the section titles never matched one another.
 */
export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
    className,
}: {
    eyebrow?: string
    title: string
    description?: string
    actions?: ReactNode
    className?: string
}) {
    return (
        <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
            <div className="min-w-0">
                {eyebrow && (
                    <p className="text-muted-foreground mb-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em]">
                        {eyebrow}
                    </p>
                )}
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">{title}</h1>
                {description && (
                    <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm leading-relaxed">{description}</p>
                )}
            </div>

            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
    );
}
