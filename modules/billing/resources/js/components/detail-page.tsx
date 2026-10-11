import { Link } from '@inertiajs/react';
import { PageContainer } from '@shared/components/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { cn } from '@shared/lib/utils';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';

/** Billing record pages share the content-editor canvas: header, tabs, main panel and a summary aside. */

/** Tracks when the page header has scrolled out of the admin scroll region. */
export function useStuckHeader() {
    const headerRef = useRef<HTMLElement>(null);
    const [stuck, setStuck] = useState(false);
    useEffect(() => {
        const header = headerRef.current;
        const region = header?.closest<HTMLElement>('#main-content');
        if (!header || !region) return;
        let frame = 0;
        // Hysteresis keeps the bar from toggling while the header edge sits at the threshold.
        const update = () => {
            frame = 0;
            const offset = header.getBoundingClientRect().bottom - region.getBoundingClientRect().top;
            setStuck((current) => (current ? offset < 24 : offset < -8));
        };
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update);
        };
        update();
        region.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            region.removeEventListener('scroll', onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);
    return { headerRef, stuck };
}

/** Compact summary that slides in from the top once the page header scrolls away. Render before the page container. */
export function DetailStickyBar({
    stuck,
    title,
    badges,
    meta,
    actions,
}: {
    stuck: boolean;
    title: string;
    badges?: ReactNode;
    meta?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <div className="sticky top-0 z-30 h-0">
            <div
                aria-hidden={!stuck}
                inert={!stuck}
                className={cn(
                    'bg-card absolute inset-x-0 top-0 border-b transition-[translate,visibility] duration-300 ease-in-out motion-reduce:transition-none',
                    stuck ? 'visible translate-y-0' : 'pointer-events-none invisible -translate-y-full',
                )}
            >
                <PageContainer padding="compact" className="flex items-center gap-3 !py-2.5">
                    <p className="min-w-0 truncate text-sm font-semibold tabular-nums">{title}</p>
                    {badges}
                    <div className="ml-auto flex shrink-0 items-center gap-3">
                        {meta && <div className="hidden text-sm tabular-nums sm:block">{meta}</div>}
                        {actions}
                    </div>
                </PageContainer>
            </div>
        </div>
    );
}

export function DetailHeader({
    headerRef,
    backHref,
    backLabel,
    title,
    badges,
    subtitle,
    actions,
}: {
    headerRef: RefObject<HTMLElement | null>;
    backHref: string;
    backLabel: string;
    title: string;
    badges?: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
}) {
    return (
        <header ref={headerRef} className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
                <Link href={backHref} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs">
                    <ArrowLeft className="size-3.5" />
                    {backLabel}
                </Link>
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight break-words tabular-nums">{title}</h1>
                    {badges}
                </div>
                {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </header>
    );
}

export type DetailTab = { value: string; label: string; count?: number; content: ReactNode };

export function DetailTabs({
    label,
    tabs,
    value,
    onValueChange,
    aside,
}: {
    label: string;
    tabs: DetailTab[];
    value: string;
    onValueChange: (value: string) => void;
    aside?: ReactNode;
}) {
    return (
        <Tabs value={value} onValueChange={onValueChange} className="content-editor-tabs mt-6 w-full first:mt-0">
            <TabsList aria-label={label}>
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="text-muted-foreground ml-1.5 text-xs tabular-nums">{tab.count}</span>
                        )}
                    </TabsTrigger>
                ))}
            </TabsList>
            <div className="content-editor-grid">
                <div className="content-editor-main">
                    {tabs.map((tab) => (
                        <TabsContent key={tab.value} value={tab.value} className="mt-0">
                            <div className="content-editor-panel">{tab.content}</div>
                        </TabsContent>
                    ))}
                </div>
                {aside && (
                    <aside className="content-editor-aside" aria-label={`${label} summary`}>
                        {aside}
                    </aside>
                )}
            </div>
        </Tabs>
    );
}

export function AsideCard({
    title,
    icon: Icon,
    description,
    action,
    children,
    className,
}: {
    title: string;
    icon?: LucideIcon;
    description?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section aria-label={title} className={cn('bg-card space-y-3 rounded-lg border p-4', className)}>
            <div>
                <div className="flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-medium">
                        {Icon && <Icon className="text-muted-foreground size-4" />}
                        {title}
                    </h2>
                    {action}
                </div>
                {description && <p className="text-muted-foreground mt-1 text-xs">{description}</p>}
            </div>
            {children}
        </section>
    );
}

export function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground shrink-0">{label}</dt>
            <dd className="min-w-0 text-right break-words tabular-nums">{children}</dd>
        </div>
    );
}

/** Reads the initial tab from `?tab=` so links can deep-link into a section. */
export function initialTab(url: string, allowed: string[], fallback = allowed[0]): string {
    const requested = new URL(url, 'http://localhost').searchParams.get('tab');
    return requested && allowed.includes(requested) ? requested : fallback;
}
