import { Link, usePage } from '@inertiajs/react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@shared/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@shared/components/ui/sidebar';
import { type NavGroup, type NavItem, type SharedData } from '@shared/types';
import { ChevronRight } from 'lucide-react';

// Helper function to check if a route is active
function isRouteActive(currentRouteName: string | null, itemHref: string): boolean {
    if (!currentRouteName) return false;

    // Map specific href patterns to route name patterns
    if (itemHref.includes('/dashboard') && currentRouteName === 'dashboard') return true;

    // Blog routes
    if (itemHref.includes('/admin/blog') && !itemHref.includes('/categories') && !itemHref.includes('/tags')) {
        return currentRouteName.startsWith('admin.blog');
    }

    // Categories routes
    if (itemHref.includes('/admin/blog/categories') || itemHref.includes('categories')) {
        return currentRouteName.startsWith('admin.categories');
    }

    // Tags routes
    if (itemHref.includes('/admin/blog/tags') || itemHref.includes('tags')) {
        return currentRouteName.startsWith('admin.tags');
    }

    // Other admin routes
    if (itemHref.includes('/admin/photography')) {
        return currentRouteName.startsWith('admin.photography');
    }

    if (itemHref.includes('/admin/projects')) {
        return currentRouteName.startsWith('admin.projects');
    }

    if (itemHref.includes('/admin/speaking')) {
        return currentRouteName.startsWith('admin.speaking');
    }

    if (itemHref.includes('/admin/tools')) {
        return currentRouteName.startsWith('admin.tools');
    }

    if (itemHref.includes('media-manager')) {
        return currentRouteName === 'media-manager';
    }

    return false;
}

function NavigationItems({ items }: { items: NavItem[] }) {
    const page = usePage<SharedData>();
    const currentRouteName = page.props.route?.name;
    const { isMobile, state, setOpen } = useSidebar();
    const rowClassName = 'gap-2 rounded-md px-2 before:hidden';

    return (
        <SidebarMenu className="gap-1">
            {items.map((item) => {
                const isActive =
                    isRouteActive(currentRouteName, item.href) ||
                    (item.items?.some((subItem) => isRouteActive(currentRouteName, subItem.href)) ?? false);
                const hasSubItems = item.items && item.items.length > 0;

                if (hasSubItems) {
                    return (
                        <Collapsible key={`${item.title}-${isActive}`} asChild defaultOpen={isActive}>
                            <SidebarMenuItem className="group/collapsible">
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        isActive={isActive}
                                        tooltip={{ children: item.title }}
                                        className={rowClassName}
                                        onClick={(event) => {
                                            if (!isMobile && state === 'collapsed') {
                                                // Reveal an already-open submenu without toggling it closed.
                                                if (event.currentTarget.getAttribute('aria-expanded') === 'true') event.preventDefault();
                                                setOpen(true);
                                            }
                                        }}
                                    >
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[collapsible=icon]:hidden group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <SidebarMenuSub className="my-1 mr-0 ml-4 gap-0.5 pr-0 pl-3">
                                        {item.items?.map((subItem) => {
                                            const subItemActive = isRouteActive(currentRouteName, subItem.href);
                                            return (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton asChild isActive={subItemActive}>
                                                        <Link href={subItem.href} prefetch aria-current={subItemActive ? 'page' : undefined}>
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            );
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                }

                return (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={{ children: item.title }} className={rowClassName}>
                            <Link href={item.href} prefetch aria-current={isActive ? 'page' : undefined}>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                );
            })}
        </SidebarMenu>
    );
}

export function NavMain({ groups = [] }: { groups: NavGroup[] }) {
    return (
        <nav aria-label="Main navigation" className="space-y-6 group-data-[collapsible=icon]:space-y-4">
            {groups.map((group) => (
                <SidebarGroup key={group.title} className="px-3 py-0 group-data-[collapsible=icon]:px-2">
                    {group.title !== 'Workspace' && !(group.items.length === 1 && group.items[0].title === group.title) && (
                        <SidebarGroupLabel className="text-sidebar-foreground mb-1 h-6 px-2 text-xs font-medium tracking-normal normal-case group-data-[collapsible=icon]:-mt-6 group-data-[collapsible=icon]:mb-0">
                            {group.title}
                        </SidebarGroupLabel>
                    )}
                    <NavigationItems items={group.items} />
                </SidebarGroup>
            ))}
        </nav>
    );
}
