import { type NavItem } from '@shared/types';
import { Camera, Files, FileText, Folder, FolderOpen, LayoutGrid, Tags, Wrench } from 'lucide-react';

/**
 * Main navigation items for the admin panel
 * These represent the actionable modules in the system
 */
export const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: route('dashboard'),
        icon: LayoutGrid,
    },
    {
        title: 'Articles',
        href: route('admin.blog.index'),
        icon: FileText,
        items: [
            {
                title: 'All Articles',
                href: route('admin.blog.index'),
                icon: FileText,
            },
            {
                title: 'Categories',
                href: route('admin.categories.index'),
                icon: Folder,
            },
            {
                title: 'Tags',
                href: route('admin.tags.index'),
                icon: Tags,
            },
        ],
    },
    {
        title: 'Photography',
        href: route('admin.photography.index'),
        icon: Camera,
    },
    {
        title: 'Media Manager',
        href: route('media-manager'),
        icon: FolderOpen,
    },
    {
        title: 'Projects',
        href: route('admin.projects.index'),
        icon: Files,
    },
    {
        title: 'Tools',
        href: route('admin.tools.index'),
        icon: Wrench,
    },
];
