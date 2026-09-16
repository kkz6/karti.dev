import { AppContent } from '@shared/components/app-content';
import { AppShell } from '@shared/components/app-shell';
import { AppSidebar } from '@shared/components/app-sidebar';
import { AppSidebarHeader } from '@shared/components/app-sidebar-header';
import { type BreadcrumbItem } from '@shared/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar" className="admin-workspace h-dvh min-h-0 flex-col overflow-hidden bg-[#252528]">
            <AppSidebarHeader breadcrumbs={breadcrumbs} />
            <div className="bg-sidebar flex min-h-0 flex-1 overflow-hidden rounded-t-2xl">
                <AppSidebar />
                <AppContent
                    variant="sidebar"
                    id="main-content"
                    tabIndex={-1}
                    scroll-region=""
                    className="border-border bg-card my-2 mr-2 ml-2 min-h-0 min-w-0 overflow-auto rounded-xl border [--app-header-height:0px] md:ml-0"
                >
                    {children}
                </AppContent>
            </div>
        </AppShell>
    );
}
