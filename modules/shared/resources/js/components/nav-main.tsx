import { type NavItem, type SharedData } from '@shared/types';
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
} from '@shared/components/ui/sidebar';
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

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage<SharedData>();
    const currentRouteName = page.props.route?.name;


    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    // For parent items, check if current route matches or any sub-item matches
                    const isActive = isRouteActive(currentRouteName, item.href) || 
                                   (item.items?.some(subItem => isRouteActive(currentRouteName, subItem.href)) ?? false);
                    const hasSubItems = item.items && item.items.length > 0;

                    if (hasSubItems) {
                        return (
                            <Collapsible key={item.title} asChild defaultOpen={isActive}>
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip={{ children: item.title }}>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items?.map((subItem) => {
                                                const subItemActive = isRouteActive(currentRouteName, subItem.href);
                                                return (
                                                    <SidebarMenuSubItem key={subItem.title}>
                                                        <SidebarMenuSubButton asChild isActive={subItemActive}>
                                                            <Link href={subItem.href} prefetch>
                                                                {subItem.icon && <subItem.icon />}
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
                            <SidebarMenuButton asChild isActive={isRouteActive(currentRouteName, item.href)} tooltip={{ children: item.title }}>
                                <Link href={item.href} prefetch>
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
