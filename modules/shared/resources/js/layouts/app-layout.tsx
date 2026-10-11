import { usePage } from '@inertiajs/react';
import AppLayout from '@shared/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@shared/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function Layout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    const { component } = usePage();
    return (
        <AppLayout breadcrumbs={breadcrumbs} {...props}>
            <div key={component} className="admin-page-transition min-h-full min-w-0">
                {children}
            </div>
        </AppLayout>
    );
}
