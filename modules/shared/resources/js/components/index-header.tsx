import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** The shared title/action row for admin listings. Actions remain page-specific. */
export function IndexHeader({ title, icon: Icon, actions }: { title: string; icon: LucideIcon; actions?: ReactNode }) {
    return (
        <header className="index-header flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
                <Icon className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />
                <h1 className="text-2xl font-semibold tracking-tight break-words">{title}</h1>
            </div>
            {actions && <div className="index-header-actions flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
    );
}
