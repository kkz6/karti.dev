import { LoaderCircle, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './button';

interface FloatingSelectionBarProps {
    count: number;
    selectionLabel?: string;
    label?: string;
    busy?: boolean;
    busyLabel?: string;
    onClear: () => void;
    children: ReactNode;
}

export function FloatingSelectionBar({
    count,
    selectionLabel,
    label = 'Selected item actions',
    busy = false,
    busyLabel = 'Working…',
    onClear,
    children,
}: FloatingSelectionBarProps) {
    if (!count) return null;

    return (
        <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-6 pointer-events-none fixed inset-x-4 bottom-5 z-40 flex justify-center pb-[env(safe-area-inset-bottom)] motion-safe:duration-200 motion-safe:ease-out">
            <section
                aria-label={label}
                aria-busy={busy}
                className="border-border/60 bg-popover text-popover-foreground pointer-events-auto flex max-h-[40vh] max-w-full flex-wrap items-center gap-2 overflow-y-auto rounded-xl border p-2 shadow-lg sm:gap-3 sm:px-3"
            >
                <p role="status" className="px-2 text-sm font-medium tabular-nums">
                    {busy ? (
                        <span className="inline-flex items-center gap-2">
                            <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
                            {busyLabel}
                        </span>
                    ) : (
                        (selectionLabel ?? `${count} selected`)
                    )}
                </p>
                <span aria-hidden="true" className="bg-border h-5 w-px" />
                <div className="flex flex-wrap items-center gap-2">{children}</div>
                <Button variant="ghost" size="icon" aria-label="Clear selection" title="Clear selection" disabled={busy} onClick={onClear}>
                    <X className="size-4" />
                </Button>
            </section>
        </div>
    );
}
