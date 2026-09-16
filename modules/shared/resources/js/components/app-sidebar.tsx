import { NavMain } from '@shared/components/nav-main';
import { Sidebar, SidebarContent } from '@shared/components/ui/sidebar';
import { mainNavGroups } from '@shared/config/navigation';

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" position="relative">
            <SidebarContent className="py-4">
                <NavMain groups={mainNavGroups} />
            </SidebarContent>
        </Sidebar>
    );
}
