import { Breadcrumbs } from '@shared/components/breadcrumbs';
import AppearanceToggleDropdown from '@shared/components/appearance-dropdown';
import { Button } from '@shared/components/ui/button';
import { Separator } from '@shared/components/ui/separator';
import { SidebarTrigger } from '@shared/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@shared/types';
import { ArrowUpRight } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-md transition-[height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-6">
            <SidebarTrigger className="-ml-1.5" />

            <Separator orientation="vertical" className="!h-4" />

            <Breadcrumbs breadcrumbs={breadcrumbs} />

            <div className="ml-auto flex items-center gap-1">
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground hidden gap-1.5 sm:inline-flex">
                    <a href="/" target="_blank" rel="noopener noreferrer">
                        View site
                        <ArrowUpRight className="size-3.5" />
                    </a>
                </Button>
                <AppearanceToggleDropdown />
            </div>
        </header>
    );
}
