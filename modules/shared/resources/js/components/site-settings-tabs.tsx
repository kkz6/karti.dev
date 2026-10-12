import { SettingsNavigation, type SettingsSection } from './settings-workspace';

export function siteSettingsSections(): SettingsSection[] {
    return [
        { id: 'general', title: 'General', href: route('admin.settings.edit') },
        { id: 'media', title: 'Media', href: route('admin.settings.media.edit') },
        { id: 'email', title: 'Email', href: route('admin.settings.email.edit') },
        { id: 'protection', title: 'Spam protection', href: route('admin.settings.protection.edit') },
    ];
}

export function SiteSettingsTabs({ section }: { section: string }) {
    return <SettingsNavigation sections={siteSettingsSections()} selected={section} label="Site settings sections" />;
}
