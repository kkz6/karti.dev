import { type NavItem } from '@shared/types';
import { BookOpen, Briefcase, Camera, FileText, Files, Folder, LayoutGrid, Settings, User, Wrench } from 'lucide-react';

/**
 * Main navigation items for the admin panel
 * These represent the actionable modules in the system
 */
export const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Blog',
        href: '/admin/blog',
        icon: FileText,
    },
    {
        title: 'Portfolio',
        href: '/admin/portfolio',
        icon: Briefcase,
    },
    {
        title: 'Photography',
        href: '/admin/photography',
        icon: Camera,
    },
    {
        title: 'Pages',
        href: '/admin/pages',
        icon: Files,
    },
    {
        title: 'Tools',
        href: '/admin/tools',
        icon: Wrench,
    },
    {
        title: 'Profile',
        href: '/admin/profile',
        icon: User,
    },
    {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
    },
];

/**
 * Footer navigation items
 * External links and documentation
 */
export const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

/**
 * Right-side navigation items for header
 * External utilities and resources
 */
export const rightNavItems: NavItem[] = footerNavItems;
