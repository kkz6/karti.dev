import { PageHeader, type PageHeaderProps } from '@shared/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { cn } from '@shared/lib/utils';
import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

/** Billing details pass their data to the shared admin page header. */
export function DetailHeader({ subtitle, ...props }: Omit<PageHeaderProps, 'description'> & { subtitle?: ReactNode }) {
    return <PageHeader {...props} description={subtitle} className="mb-8" />;
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
