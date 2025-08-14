import AppLayout from '@shared/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@shared/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayout breadcrumbs={breadcrumbs} {...props}>
        {children}
    </AppLayout>
);
