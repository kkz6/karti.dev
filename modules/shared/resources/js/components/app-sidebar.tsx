import { Link } from '@inertiajs/react';
import { NavMain } from '@shared/components/nav-main';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@shared/components/ui/sidebar';
import { mainNavGroups } from '@shared/config/navigation';
import AppLogo from './app-logo';

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="h-14 shrink-0 border-b border-white/10 bg-[#202124] p-2 text-white">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="h-10 rounded-sm text-white hover:bg-white/10 hover:text-white">
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="pt-3">
                <NavMain groups={mainNavGroups} />
            </SidebarContent>
        </Sidebar>
    );
}
