import { usePage } from '@inertiajs/react';
import { PageContainer } from '@shared/components/page-container';
import { PageHeader, PageHeaderSlot, type PageHeaderProps } from '@shared/components/page-header';
import AppLayout from '@shared/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@shared/types';
import { useState, type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    header?: PageHeaderProps;
}

export default function Layout({ children, breadcrumbs, header, ...props }: AppLayoutProps) {
    const { component } = usePage();
    const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);
    return (
        <AppLayout breadcrumbs={breadcrumbs} {...props}>
            <div key={component} className="admin-page-transition min-h-full min-w-0 shrink-0">
                <PageHeaderSlot.Provider value={headerSlot}>
                    <div ref={setHeaderSlot} className="sticky top-0 z-30 h-0" />
                    {header && (
                        <PageContainer padding="compact">
                            <PageHeader {...header} />
                        </PageContainer>
                    )}
                    {children}
                </PageHeaderSlot.Provider>
            </div>
        </AppLayout>
    );
}
