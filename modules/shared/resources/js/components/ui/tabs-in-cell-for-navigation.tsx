import { cn } from '@shared/lib/utils';
import { Box, House, PanelsTopLeft, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ScrollArea, ScrollBar } from './scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

export type ContentTab = { value: string; label: string; content: ReactNode; icon?: LucideIcon; count?: number };

export function ContentTabs({
    tabs,
    defaultValue,
    className,
    label = 'Invoice sections',
    toolbar,
    contentClassName,
}: {
    tabs: ContentTab[];
    defaultValue?: string;
    className?: string;
    label?: string;
    toolbar?: ReactNode;
    contentClassName?: string;
}) {
    return (
        <Tabs defaultValue={defaultValue ?? tabs[0]?.value} className={cn('min-w-0', className)}>
            <ScrollArea hideVerticalScrollbar className="mb-3 w-full border-b">
                <TabsList aria-label={label} className="h-auto w-max justify-start rounded-none bg-transparent p-0">
                    {tabs.map(({ value, label, icon: Icon, count }) => (
                        <TabsTrigger
                            key={value}
                            value={value}
                            className="data-[state=active]:border-primary group focus-visible:outline-ring relative -mb-px rounded-none border-0 border-b-2 border-transparent px-3 py-2.5 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                        >
                            {Icon && <Icon className="-ms-0.5 me-1.5 opacity-60" size={16} strokeWidth={2} aria-hidden="true" />}
                            {label}
                            {count !== undefined && count > 0 && (
                                <span className="ml-1 rounded-full border px-1.5 py-0.5 text-[10px] leading-none">{count}</span>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
            <div className="bg-card overflow-hidden rounded-lg border">
                {toolbar}
                {tabs.map((tab) => (
                    <TabsContent key={tab.value} value={tab.value} className={cn('invoice-tab-content mt-0 min-w-0 p-5 sm:p-7', contentClassName)}>
                        {tab.content}
                    </TabsContent>
                ))}
            </div>
        </Tabs>
    );
}
export function TabDemo() {
    return (
        <ContentTabs
            label="Example navigation"
            defaultValue="tab-1"
            tabs={[
                {
                    value: 'tab-1',
                    label: 'Overview',
                    icon: House,
                    content: <p className="text-muted-foreground p-4 pt-1 text-center text-xs">Content for Tab 1</p>,
                },
                {
                    value: 'tab-2',
                    label: 'Projects',
                    icon: PanelsTopLeft,
                    content: <p className="text-muted-foreground p-4 pt-1 text-center text-xs">Content for Tab 2</p>,
                },
                {
                    value: 'tab-3',
                    label: 'Packages',
                    icon: Box,
                    content: <p className="text-muted-foreground p-4 pt-1 text-center text-xs">Content for Tab 3</p>,
                },
            ]}
        />
    );
}
