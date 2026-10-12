import { usePage } from '@inertiajs/react';
import { SettingsWorkspace } from '@shared/components/settings-workspace';
import { type NavItem } from '@shared/types';
import { Settings } from 'lucide-react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: route('profile.edit'),
        icon: null,
    },
    {
        title: 'Password',
        href: route('password.edit'),
        icon: null,
    },
    {
        title: 'Appearance',
        href: route('appearance'),
        icon: null,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { url } = usePage();
    const currentPath = new URL(url, 'https://navigation.invalid').pathname;

    return (
        <SettingsWorkspace
            title="Account settings"
            icon={Settings}
            selected={currentPath}
            sections={sidebarNavItems.map((item) => ({
                id: new URL(item.href, 'https://navigation.invalid').pathname,
                title: item.title,
                href: item.href,
            }))}
        >
            {children}
        </SettingsWorkspace>
    );
}
