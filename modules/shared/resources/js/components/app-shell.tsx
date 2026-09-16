import { usePage } from '@inertiajs/react';
import { SidebarProvider } from '@shared/components/ui/sidebar';
import { SharedData } from '@shared/types';
import { SiteIdentityHead } from './site-identity-head';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
    className?: string;
}

export function AppShell({ children, variant = 'header', className }: AppShellProps) {
    const isOpen = usePage<SharedData>().props.sidebarOpen;

    if (variant === 'header') {
        return <div className="flex min-h-screen w-full flex-col"><SiteIdentityHead />{children}</div>;
    }

    return (
        <SidebarProvider defaultOpen={isOpen} className={className}>
            <SiteIdentityHead />
            {children}
        </SidebarProvider>
    );
}
