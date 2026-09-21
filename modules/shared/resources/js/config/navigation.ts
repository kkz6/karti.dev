import { type NavGroup, type NavItem } from '@shared/types';
import { Camera, Files, FileText, Folder, FolderOpen, Image, LayoutGrid, Mail, Mic, Search, Settings, Tags, Wrench } from 'lucide-react';

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
        title: 'Speaking',
        href: route('admin.speaking.index'),
        icon: Mic,
    },
    {
        title: 'Tools',
        href: route('admin.tools.index'),
        icon: Wrench,
    },
    {
        title: 'SEO',
        href: route('admin.seo.index'),
        icon: Search,
        items: [
            { title: 'Local traffic', href: route('admin.seo.index'), icon: Search },
            { title: 'Google Analytics', href: route('admin.seo.google'), icon: Search },
        ],
    },
    { title: 'Newsletter', href: route('admin.newsletter.index'), icon: Mail },
    { title: 'Site settings', href: route('admin.settings.edit'), icon: Settings },
    { title: 'Media settings', href: route('admin.settings.media.edit'), icon: Image },
    { title: 'Email settings', href: route('admin.settings.email.edit'), icon: Mail },
];

export const mainNavGroups: NavGroup[] = [
    {
        title: 'Workspace',
        items: mainNavItems.filter((item) => item.title === 'Dashboard'),
    },
    {
        title: 'Content',
        items: mainNavItems.filter((item) => ['Articles', 'Photography', 'Media Manager', 'Projects', 'Speaking'].includes(item.title)),
    },
    {
        title: 'Tools',
        items: mainNavItems.filter((item) => ['Tools', 'SEO', 'Newsletter'].includes(item.title)),
    },
    { title: 'Settings', items: mainNavItems.filter((item) => ['Site settings', 'Media settings', 'Email settings'].includes(item.title)) },
];
