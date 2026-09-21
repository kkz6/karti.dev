import { SidebarInset } from '@shared/components/ui/sidebar';
import * as React from 'react';
import { PageContainer } from './page-container';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    if (variant === 'sidebar') {
        return <SidebarInset {...props}>{children}</SidebarInset>;
    }

    return (
        <PageContainer as="main" padding="none" className="flex h-full flex-1 flex-col gap-4 rounded-xl" {...props}>
            {children}
        </PageContainer>
    );
}
