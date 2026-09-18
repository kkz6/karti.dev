import { router, usePage } from '@inertiajs/react';
import { adminTabUrl, readAdminTab } from '@shared/lib/admin-tab';

/** Keep page tabs in Inertia history without a request, remount, or loss of form state. */
export function useAdminTab(tabs: readonly string[], fallback: string, parameter = 'tab'): [string, (value: string) => void] {
    const { url } = usePage();
    const activeTab = readAdminTab(url, tabs, fallback, parameter);

    const setActiveTab = (value: string) => {
        if (!tabs.includes(value) || value === activeTab) return;
        router.replace({
            url: adminTabUrl(url, value, parameter),
            preserveState: true,
            preserveScroll: true,
        });
    };

    return [activeTab, setActiveTab];
}
