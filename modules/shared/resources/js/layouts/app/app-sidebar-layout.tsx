import { AppContent } from '@shared/components/app-content';
import { AppShell } from '@shared/components/app-shell';
import { AppSidebar } from '@shared/components/app-sidebar';
import { AppSidebarHeader } from '@shared/components/app-sidebar-header';
import { type BreadcrumbItem } from '@shared/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="min-w-0 overflow-x-clip [--app-header-height:3.5rem] group-has-data-[collapsible=icon]/sidebar-wrapper:[--app-header-height:3rem]"
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
            </AppContent>
        </AppShell>
    );
}
