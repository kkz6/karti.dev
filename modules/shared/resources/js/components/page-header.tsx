import { cn } from '@shared/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PageContainer } from './page-container';

/** The layout owns the full-width sticky surface; page headers supply its contents. */
export const PageHeaderSlot = createContext<HTMLDivElement | null>(null);

export interface PageHeaderProps {
    title: string;
    eyebrow?: string;
    icon?: LucideIcon;
    badges?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    stickyDescription?: ReactNode;
    stickyMeta?: ReactNode;
    stickyActions?: ReactNode;
    sticky?: boolean;
    className?: string;
}

/** One header contract for lists, records, editors and settings. */
export function PageHeader({
    title,
    eyebrow,
    icon: Icon,
    badges,
    description,
    actions,
    stickyDescription = description,
    stickyMeta,
    stickyActions = actions,
    sticky = true,
    className,
}: PageHeaderProps) {
    const slot = useContext(PageHeaderSlot);
    const headerRef = useRef<HTMLElement>(null);
    const stickyRef = useRef<HTMLDivElement>(null);
    const [stuck, setStuck] = useState(false);

    useEffect(() => {
        const header = headerRef.current;
        const region = header?.closest<HTMLElement>('#main-content');
        // Embedded forms and secondary section headers must not replace the page heading.
        if (!slot || !sticky || !header || !region || header.closest('[role="dialog"]')) return;
        if (region.querySelector('[data-page-header]') !== header) return;
        let frame = 0;
        const update = () => {
            frame = 0;
            const offset = header.getBoundingClientRect().bottom - region.getBoundingClientRect().top;
            setStuck((current) => (current ? offset < 24 : offset < -8));
        };
        const schedule = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        const observer = new ResizeObserver(schedule);
        observer.observe(header);
        observer.observe(region);
        region.addEventListener('scroll', schedule, { passive: true });
        update();
        return () => {
            observer.disconnect();
            region.removeEventListener('scroll', schedule);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [slot, sticky]);

    useEffect(() => {
        const header = headerRef.current;
        const region = header?.closest<HTMLElement>('#main-content');
        const bar = stickyRef.current;
        if (!region || !bar || region.querySelector('[data-page-header]') !== header) return;
        const update = () => region.style.setProperty('--page-sticky-header-height', stuck ? `${bar.getBoundingClientRect().height}px` : '0px');
        const observer = new ResizeObserver(update);
        observer.observe(bar);
        update();
        return () => {
            observer.disconnect();
            region.style.removeProperty('--page-sticky-header-height');
        };
    }, [slot, stuck]);

    return (
        <>
            <header
                ref={headerRef}
                data-page-header
                className={cn('flex flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap', className)}
            >
                <div className="w-full min-w-0 flex-1 space-y-2 sm:w-auto">
                    {eyebrow && <p className="text-muted-foreground text-xs font-medium">{eyebrow}</p>}
                    <div className="flex min-w-0 flex-wrap items-center gap-3">
                        {Icon && <Icon className="text-muted-foreground size-5 shrink-0" aria-hidden="true" />}
                        <h1 className="min-w-0 text-2xl font-semibold tracking-tight break-words">{title}</h1>
                        {badges}
                    </div>
                    {description && <div className="text-muted-foreground max-w-3xl text-sm leading-6">{description}</div>}
                </div>
                {actions && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}
            </header>
            {slot &&
                sticky &&
                createPortal(
                    <div
                        ref={stickyRef}
                        data-sticky-page-header
                        aria-hidden={!stuck}
                        inert={!stuck}
                        className={cn(
                            'bg-card absolute inset-x-0 top-0 border-b transition-[translate,visibility] duration-200 motion-reduce:transition-none',
                            stuck ? 'visible translate-y-0' : 'pointer-events-none invisible -translate-y-full',
                        )}
                    >
                        <PageContainer padding="header" className="flex items-center gap-3 py-2.5">
                            <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                                {Icon && <Icon className="text-muted-foreground hidden size-4 shrink-0 sm:block" aria-hidden="true" />}
                                <p title={title} className="min-w-0 truncate text-sm font-semibold">
                                    {title}
                                </p>
                                {badges && <div className="flex shrink-0 items-center gap-2">{badges}</div>}
                                {stickyDescription && (
                                    <div className="text-muted-foreground hidden min-w-0 flex-1 truncate text-sm lg:block">{stickyDescription}</div>
                                )}
                            </div>
                            {stickyMeta && <div className="hidden shrink-0 text-sm tabular-nums md:block">{stickyMeta}</div>}
                            {stickyActions && (
                                <div className="flex max-w-[70%] shrink-0 flex-wrap items-center justify-end gap-2 sm:max-w-full">{stickyActions}</div>
                            )}
                        </PageContainer>
                    </div>,
                    slot,
                )}
        </>
    );
}
