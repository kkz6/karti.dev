import { cn } from '@shared/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type SummaryItem = {
    label: string;
    value: string | number;
    currency?: string;
    icon?: LucideIcon;
    emphasis?: boolean;
    description?: ReactNode;
};

/** Shared compact, bordered metrics for admin pages. */
export function StatSummary({ items }: { items: SummaryItem[] }) {
    return (
        <dl
            className={cn(
                'grid gap-3',
                items.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : items.length === 5 ? 'grid-cols-2 xl:grid-cols-5' : 'grid-cols-2 lg:grid-cols-4',
            )}
        >
            {items.map(({ label, value, currency, icon: Icon, emphasis, description }) => (
                <div key={label} className="bg-card border-border min-w-0 rounded-lg border p-4 shadow-xs" data-emphasis={emphasis || undefined}>
                    <dt className="text-muted-foreground flex items-center justify-between gap-2 text-xs font-medium">
                        {label}
                        {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                    </dt>
                    <dd className="mt-2 flex flex-wrap items-baseline gap-1.5 text-xl font-semibold tracking-tight tabular-nums">
                        {value}
                        {currency && <span className="text-muted-foreground text-xs font-normal">{currency}</span>}
                    </dd>
                    {description && <dd className="text-muted-foreground mt-1 text-xs">{description}</dd>}
                </div>
            ))}
        </dl>
    );
}
